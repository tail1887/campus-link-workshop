import { NextResponse } from "next/server";
import {
  isAlertDigestFrequency,
  isPlainObject,
  isQuietHours,
} from "@/lib/profile";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import {
  getAlertPreferenceRecord,
  updateAlertPreferenceRecord,
} from "@/lib/server/profile-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  AlertPreferencePayload,
  ProfileErrorCode,
  UpdateAlertPreferenceRequest,
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
          message: "알림 설정을 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const alertPreference = await getAlertPreferenceRecord(authContext.user);

  return NextResponse.json<ApiSuccess<AlertPreferencePayload>>({
    success: true,
    data: {
      alertPreference,
      dataSource: getIdentityDataSource(),
    },
  });
}

export async function PUT(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "알림 설정을 수정하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !isPlainObject(body) ||
    (body.emailEnabled !== undefined && typeof body.emailEnabled !== "boolean") ||
    (body.inAppEnabled !== undefined && typeof body.inAppEnabled !== "boolean") ||
    (body.applicationUpdates !== undefined &&
      typeof body.applicationUpdates !== "boolean") ||
    (body.verificationUpdates !== undefined &&
      typeof body.verificationUpdates !== "boolean") ||
    (body.inquiryReplies !== undefined && typeof body.inquiryReplies !== "boolean") ||
    (body.marketingEnabled !== undefined && typeof body.marketingEnabled !== "boolean") ||
    (body.digestFrequency !== undefined &&
      !isAlertDigestFrequency(body.digestFrequency)) ||
    (body.quietHours !== undefined && !isQuietHours(body.quietHours))
  ) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "알림 설정 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const alertPreference = await updateAlertPreferenceRecord(
    authContext.user,
    body as UpdateAlertPreferenceRequest,
  );

  return NextResponse.json<ApiSuccess<AlertPreferencePayload>>({
    success: true,
    data: {
      alertPreference,
      dataSource: getIdentityDataSource(),
    },
  });
}
