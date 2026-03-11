import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/identity";
import {
  isCollaborationStyle,
  isExternalLink,
  isPlainObject,
  isWeeklyHours,
} from "@/lib/profile";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import {
  getProfileContextRecord,
  updateProfileContextRecord,
} from "@/lib/server/profile-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  ProfileContextPayload,
  ProfileErrorCode,
  UpdateProfileRequest,
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
          message: "프로필을 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const profileContext = await getProfileContextRecord({
    user: authContext.user,
    onboarding: authContext.onboarding,
  });

  return NextResponse.json<ApiSuccess<ProfileContextPayload>>({
    success: true,
    data: {
      ...profileContext,
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
          message: "프로필을 수정하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !isPlainObject(body) ||
    (body.headline !== undefined && typeof body.headline !== "string") ||
    (body.intro !== undefined && typeof body.intro !== "string") ||
    (body.collaborationStyle !== undefined &&
      body.collaborationStyle !== null &&
      !isCollaborationStyle(body.collaborationStyle)) ||
    (body.weeklyHours !== undefined &&
      body.weeklyHours !== null &&
      !isWeeklyHours(body.weeklyHours)) ||
    (body.contactEmail !== undefined &&
      body.contactEmail !== null &&
      (typeof body.contactEmail !== "string" ||
        !isValidEmail(body.contactEmail.trim()))) ||
    (body.openToRoles !== undefined &&
      (!Array.isArray(body.openToRoles) ||
        body.openToRoles.some((value) => typeof value !== "string"))) ||
    (body.links !== undefined &&
      (!Array.isArray(body.links) || body.links.some((value) => !isExternalLink(value))))
  ) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "프로필 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const profileContext = await updateProfileContextRecord({
    user: authContext.user,
    onboarding: authContext.onboarding,
    patch: body as UpdateProfileRequest,
  });

  return NextResponse.json<ApiSuccess<ProfileContextPayload>>({
    success: true,
    data: {
      ...profileContext,
      dataSource: getIdentityDataSource(),
    },
  });
}
