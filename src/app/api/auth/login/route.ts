import { NextResponse } from "next/server";
import {
  buildAuthenticatedAuthContext,
  normalizeText,
} from "@/lib/identity";
import {
  createIdentitySession,
  findIdentityAccountByEmail,
  getIdentityDataSource,
} from "@/lib/server/identity-repository";
import { verifyPassword } from "@/lib/server/password";
import { setSessionCookieValue } from "@/lib/server/session-cookie";
import type {
  ApiError,
  ApiSuccess,
  AuthContextPayload,
  LoginRequest,
} from "@/types/identity";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LoginRequest>;
  const email = body.email ? body.email.trim() : "";
  const password = body.password ? normalizeText(body.password) : "";

  if (!email || !password) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "이메일과 비밀번호를 입력해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const account = await findIdentityAccountByEmail(email);

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        },
      },
      { status: 401 },
    );
  }

  const session = await createIdentitySession(account.user.id);
  await setSessionCookieValue(session.id, session.expiresAt);
  const authContext = buildAuthenticatedAuthContext({
    session,
    user: account.user,
    onboarding: account.onboarding,
  });

  return NextResponse.json<ApiSuccess<AuthContextPayload>>({
    success: true,
    data: {
      ...authContext,
      dataSource: getIdentityDataSource(),
    },
  });
}
