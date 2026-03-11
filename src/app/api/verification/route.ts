import { NextResponse } from "next/server";
import {
  isPlainObject,
  isVerificationMethod,
  isValidHttpUrl,
} from "@/lib/profile";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import {
  getVerificationRecord,
  submitVerificationRecord,
} from "@/lib/server/profile-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  ProfileErrorCode,
  SubmitVerificationRequest,
  VerificationPayload,
} from "@/types/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "인증 상태를 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const verification = await getVerificationRecord(authContext.user);

  return NextResponse.json<ApiSuccess<VerificationPayload>>({
    success: true,
    data: {
      verification,
      dataSource: getIdentityDataSource(),
    },
  });
}

export async function POST(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "인증 요청을 제출하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !isPlainObject(body) ||
    !isVerificationMethod(body.method) ||
    (body.evidenceLabel !== undefined &&
      body.evidenceLabel !== null &&
      typeof body.evidenceLabel !== "string") ||
    (body.evidenceUrl !== undefined &&
      body.evidenceUrl !== null &&
      (typeof body.evidenceUrl !== "string" ||
        !isValidHttpUrl(body.evidenceUrl.trim()))) ||
    (body.note !== undefined && body.note !== null && typeof body.note !== "string")
  ) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "인증 요청 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const result = await submitVerificationRecord(
    authContext.user,
    body as SubmitVerificationRequest,
  );

  if (!result.success) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: result.errorCode,
          message:
            result.errorCode === "VERIFICATION_ALREADY_PENDING"
              ? "이미 검토 중인 인증 요청이 있습니다."
              : "이미 인증이 완료된 계정입니다.",
        },
      },
      { status: 409 },
    );
  }

  return NextResponse.json<ApiSuccess<VerificationPayload>>(
    {
      success: true,
      data: {
        verification: result.verification,
        dataSource: getIdentityDataSource(),
      },
    },
    { status: 202 },
  );
}
