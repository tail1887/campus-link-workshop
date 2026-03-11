import { NextResponse } from "next/server";
import { buildEmptyAuthContext } from "@/lib/identity";
import {
  deleteIdentitySession,
  getAuthContextBySessionId,
  getIdentityDataSource,
} from "@/lib/server/identity-repository";
import {
  clearSessionCookieValue,
  getSessionCookieValue,
} from "@/lib/server/session-cookie";
import type {
  ApiSuccess,
  AuthContextPayload,
  IdentitySessionClearPayload,
} from "@/types/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionId = await getSessionCookieValue();

  if (!sessionId) {
    return NextResponse.json<ApiSuccess<AuthContextPayload>>({
      success: true,
      data: {
        ...buildEmptyAuthContext(),
        dataSource: getIdentityDataSource(),
      },
    });
  }

  const authContext = await getAuthContextBySessionId(sessionId);

  if (!authContext) {
    await clearSessionCookieValue();

    return NextResponse.json<ApiSuccess<AuthContextPayload>>({
      success: true,
      data: {
        ...buildEmptyAuthContext(),
        dataSource: getIdentityDataSource(),
      },
    });
  }

  return NextResponse.json<ApiSuccess<AuthContextPayload>>({
    success: true,
    data: {
      ...authContext,
      dataSource: getIdentityDataSource(),
    },
  });
}

export async function DELETE() {
  const sessionId = await getSessionCookieValue();

  if (sessionId) {
    await deleteIdentitySession(sessionId);
  }

  await clearSessionCookieValue();

  return NextResponse.json<ApiSuccess<IdentitySessionClearPayload>>({
    success: true,
    data: {
      cleared: true,
      dataSource: getIdentityDataSource(),
    },
  });
}
