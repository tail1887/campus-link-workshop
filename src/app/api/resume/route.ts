import { NextResponse } from "next/server";
import {
  isExternalLink,
  isPlainObject,
  isResumeExperience,
  isResumeProject,
  isResumeVisibility,
} from "@/lib/profile";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import {
  getResumeRecord,
  updateResumeRecord,
} from "@/lib/server/profile-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  ProfileErrorCode,
  ResumePayload,
  UpdateResumeRequest,
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
          message: "이력서를 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const resumeRecord = await getResumeRecord(authContext.user);

  return NextResponse.json<ApiSuccess<ResumePayload>>({
    success: true,
    data: {
      ...resumeRecord,
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
          message: "이력서를 수정하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !isPlainObject(body) ||
    (body.title !== undefined && typeof body.title !== "string") ||
    (body.summary !== undefined && typeof body.summary !== "string") ||
    (body.education !== undefined && typeof body.education !== "string") ||
    (body.skills !== undefined &&
      (!Array.isArray(body.skills) ||
        body.skills.some((value) => typeof value !== "string"))) ||
    (body.experience !== undefined &&
      (!Array.isArray(body.experience) ||
        body.experience.some((value) => !isResumeExperience(value)))) ||
    (body.projects !== undefined &&
      (!Array.isArray(body.projects) ||
        body.projects.some((value) => !isResumeProject(value)))) ||
    (body.links !== undefined &&
      (!Array.isArray(body.links) || body.links.some((value) => !isExternalLink(value)))) ||
    (body.visibility !== undefined && !isResumeVisibility(body.visibility))
  ) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "이력서 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const resumeRecord = await updateResumeRecord(
    authContext.user,
    body as UpdateResumeRequest,
  );

  return NextResponse.json<ApiSuccess<ResumePayload>>({
    success: true,
    data: {
      ...resumeRecord,
      dataSource: getIdentityDataSource(),
    },
  });
}
