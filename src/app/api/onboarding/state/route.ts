import { NextResponse } from "next/server";
import { isOnboardingStatus, isOnboardingStep } from "@/lib/identity";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import {
  getIdentityDataSource,
  updateIdentityOnboardingState,
} from "@/lib/server/identity-repository";
import type {
  ApiError,
  ApiSuccess,
  OnboardingStatePayload,
  UpdateOnboardingStateRequest,
} from "@/types/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "온보딩 상태를 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  return NextResponse.json<ApiSuccess<OnboardingStatePayload>>({
    success: true,
    data: {
      onboarding: authContext.onboarding,
      dataSource: getIdentityDataSource(),
    },
  });
}

export async function PUT(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "온보딩 상태를 수정하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Partial<UpdateOnboardingStateRequest>;

  if (
    (body.status !== undefined && !isOnboardingStatus(body.status)) ||
    (body.currentStep !== undefined && !isOnboardingStep(body.currentStep)) ||
    (body.interestKeywords !== undefined &&
      (!Array.isArray(body.interestKeywords) ||
        body.interestKeywords.some((value) => typeof value !== "string")))
  ) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "온보딩 상태 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const onboarding = await updateIdentityOnboardingState(
    authContext.user.id,
    body,
  );

  if (!onboarding) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "온보딩 상태를 찾을 수 없습니다.",
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json<ApiSuccess<OnboardingStatePayload>>({
    success: true,
    data: {
      onboarding,
      dataSource: getIdentityDataSource(),
    },
  });
}
