import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getAiSuggestionJobRecord } from "@/lib/server/ai-platform-repository";
import { getAiPlatformProviderCatalog } from "@/lib/server/ai-platform-provider";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  AiPlatformErrorCode,
  AiSuggestionJobPayload,
} from "@/types/ai";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "AI suggestion job 상태를 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const { jobId } = await context.params;
  const job = await getAiSuggestionJobRecord(authContext.user, jobId);

  if (!job) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "해당 AI suggestion job을 찾을 수 없습니다.",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json<ApiSuccess<AiSuggestionJobPayload>>({
    success: true,
    data: {
      job,
      providers: getAiPlatformProviderCatalog(),
      dataSource: getIdentityDataSource(),
    },
  });
}
