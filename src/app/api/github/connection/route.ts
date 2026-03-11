import { NextResponse } from "next/server";
import { isUpdateGitHubConnectionRequest } from "@/lib/ai-platform";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import {
  disconnectGitHubConnectionRecord,
  getGitHubConnectionRecord,
  upsertGitHubConnectionRecord,
} from "@/lib/server/ai-platform-repository";
import { getAiPlatformProviderCatalog } from "@/lib/server/ai-platform-provider";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  AiPlatformErrorCode,
  GitHubConnectionPayload,
} from "@/types/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "GitHub 연결 상태를 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const connection = await getGitHubConnectionRecord(authContext.user);

  return NextResponse.json<ApiSuccess<GitHubConnectionPayload>>({
    success: true,
    data: {
      connection,
      providers: getAiPlatformProviderCatalog(),
      dataSource: getIdentityDataSource(),
    },
  });
}

export async function PUT(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "GitHub 계정을 연결하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!isUpdateGitHubConnectionRequest(body)) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "GitHub 사용자명 또는 프로필 URL을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const connection = await upsertGitHubConnectionRecord(authContext.user, body);

  return NextResponse.json<ApiSuccess<GitHubConnectionPayload>>({
    success: true,
    data: {
      connection,
      providers: getAiPlatformProviderCatalog(),
      dataSource: getIdentityDataSource(),
    },
  });
}

export async function DELETE() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    return NextResponse.json<ApiError<AiPlatformErrorCode>>(
      {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "GitHub 연결을 해제하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const connection = await disconnectGitHubConnectionRecord(authContext.user);

  return NextResponse.json<ApiSuccess<GitHubConnectionPayload>>({
    success: true,
    data: {
      connection,
      providers: getAiPlatformProviderCatalog(),
      dataSource: getIdentityDataSource(),
    },
  });
}
