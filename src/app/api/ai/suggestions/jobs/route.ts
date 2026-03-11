import { NextResponse } from "next/server";
import { isCreateAiSuggestionJobRequest } from "@/lib/ai-platform";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { createAiSuggestionJobRecord } from "@/lib/server/ai-platform-repository";
import { getAiPlatformProviderCatalog } from "@/lib/server/ai-platform-provider";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  AiPlatformErrorCode,
  AiSuggestionJobPayload,
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
          message: "AI suggestion을 요청하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!isCreateAiSuggestionJobRequest(body)) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "AI suggestion 요청 본문을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const job = await createAiSuggestionJobRecord(authContext.user, body);

  return NextResponse.json<ApiSuccess<AiSuggestionJobPayload>>(
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
