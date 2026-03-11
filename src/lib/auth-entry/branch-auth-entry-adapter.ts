import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ENTRY_COOKIE_NAME } from "@/lib/auth-entry/constants";

export type AuthEntryMode = "login" | "signup";

export type AuthEntrySessionView = {
  email: string;
  displayName: string | null;
  mode: AuthEntryMode;
};

type TempAuthEntryPayload = {
  email: string;
  displayName: string | null;
  mode: AuthEntryMode;
  issuedAt: string;
};

function getAuthEntrySecret() {
  return process.env.AUTH_ENTRY_SECRET || "campus-link-auth-entry-dev";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getAuthEntrySecret())
    .update(value)
    .digest("base64url");
}

function createSignedToken(payload: TempAuthEntryPayload) {
  const encoded = encodeBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function readSignedToken(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(encoded)) as TempAuthEntryPayload;
  } catch {
    return null;
  }
}

function mapSessionView(payload: TempAuthEntryPayload): AuthEntrySessionView {
  return {
    email: payload.email,
    displayName: payload.displayName,
    mode: payload.mode,
  };
}

export function normalizeAuthEntryEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createAuthEntryCookieValue(input: {
  email: string;
  displayName?: string | null;
  mode: AuthEntryMode;
}) {
  return createSignedToken({
    email: normalizeAuthEntryEmail(input.email),
    displayName: input.displayName?.trim() || null,
    mode: input.mode,
    issuedAt: new Date().toISOString(),
  });
}

export function getAuthEntryCookieOptions(maxAge = 60 * 60 * 24) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function getAuthEntrySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_ENTRY_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = readSignedToken(token);

  return payload ? mapSessionView(payload) : null;
}

export async function requireAuthEntrySession(pathname: string) {
  const session = await getAuthEntrySession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return session;
}
