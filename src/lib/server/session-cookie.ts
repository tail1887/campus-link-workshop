import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/identity";

function getCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

export async function getSessionCookieValue() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookieValue(sessionId: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    sessionId,
    getCookieOptions(new Date(expiresAt)),
  );
}

export async function clearSessionCookieValue() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getCookieOptions(new Date(0)),
    maxAge: 0,
  });
}
