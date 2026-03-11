import { NextResponse } from "next/server";
import {
  buildAuthenticatedAuthContext,
  isValidEmail,
  isValidPassword,
  normalizeOptionalText,
  normalizeText,
} from "@/lib/identity";
import {
  createIdentitySession,
  createIdentityUser,
  findIdentityAccountByEmail,
  getIdentityDataSource,
} from "@/lib/server/identity-repository";
import { hashPassword } from "@/lib/server/password";
import { setSessionCookieValue } from "@/lib/server/session-cookie";
import type {
  ApiError,
  ApiSuccess,
  AuthContextPayload,
  SignupRequest,
} from "@/types/identity";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SignupRequest>;
  const email = body.email ? body.email.trim() : "";
  const displayName = body.displayName ? normalizeText(body.displayName) : "";
  const password = body.password ? normalizeText(body.password) : "";

  if (!isValidEmail(email) || !isValidPassword(password) || !displayName) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "이메일, 비밀번호, 이름을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const existing = await findIdentityAccountByEmail(email);

  if (existing) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "EMAIL_ALREADY_IN_USE",
          message: "이미 사용 중인 이메일입니다.",
        },
      },
      { status: 409 },
    );
  }

  const created = await createIdentityUser({
    email,
    passwordHash: hashPassword(password),
    displayName,
    campus: normalizeOptionalText(body.campus),
    role: "student",
  });

  const session = await createIdentitySession(created.user.id);
  await setSessionCookieValue(session.id, session.expiresAt);
  const authContext = buildAuthenticatedAuthContext({
    session,
    user: created.user,
    onboarding: created.onboarding,
  });

  return NextResponse.json<ApiSuccess<AuthContextPayload>>(
    {
      success: true,
      data: {
        ...authContext,
        dataSource: getIdentityDataSource(),
      },
    },
    { status: 201 },
  );
}
