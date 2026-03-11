import { NextResponse } from "next/server";
import { isGitHubAnalysisJobInput } from "@/lib/ai-platform";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { createGitHubAnalysisJobRecord } from "@/lib/server/ai-platform-repository";
import { getAiPlatformProviderCatalog } from "@/lib/server/ai-platform-provider";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  AiPlatformErrorCode,
  GitHubAnalysisJobPayload,
} from "@/types/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "GitHub 분석을 시작하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const body = rawBody ?? {};

  if (!isGitHubAnalysisJobInput(body)) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "GitHub 분석 요청값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const job = await createGitHubAnalysisJobRecord(authContext.user, body);

  if (!job) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "GITHUB_CONNECTION_REQUIRED",
          message: "분석을 시작하기 전에 GitHub 계정을 먼저 연결해주세요.",
        },
      },
      { status: 409 },
    );
  }

  return NextResponse.json<ApiSuccess<GitHubAnalysisJobPayload>>(
    {
      success: true,
      data: {
        job,
        providers: getAiPlatformProviderCatalog(),
        dataSource: getIdentityDataSource(),
      },
    },
    { status: 202 },
  );
}
