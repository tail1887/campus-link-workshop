import { NextResponse } from "next/server";
import {
  createAuthEntryCookieValue,
  getAuthEntryCookieOptions,
  normalizeAuthEntryEmail,
} from "@/lib/auth-entry/branch-auth-entry-adapter";
import { AUTH_ENTRY_COOKIE_NAME } from "@/lib/auth-entry/constants";
import { getDefaultAuthEntryNextPath } from "@/lib/auth-entry/integration-points";

type AuthEntryRequestBody = {
  email?: string;
  displayName?: string;
  mode?: "login" | "signup";
};

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie = cookieHeader.includes(`${AUTH_ENTRY_COOKIE_NAME}=`);

  return NextResponse.json({
    success: true,
    data: {
      hasSession: hasSessionCookie,
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AuthEntryRequestBody;
  const email = normalizeAuthEntryEmail(body.email ?? "");
  const mode = body.mode;

  if (!mode || (mode !== "login" && mode !== "signup")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_MODE",
          message: "로그인 또는 회원가입 진입 모드를 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "이메일을 입력해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      nextPath: getDefaultAuthEntryNextPath(mode),
    },
  });

  response.cookies.set(
    AUTH_ENTRY_COOKIE_NAME,
    createAuthEntryCookieValue({
      email,
      displayName: body.displayName,
      mode,
    }),
    getAuthEntryCookieOptions(),
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(AUTH_ENTRY_COOKIE_NAME, "", getAuthEntryCookieOptions(0));

  return response;
}
