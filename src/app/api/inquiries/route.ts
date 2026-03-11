import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/identity";
import { isInquiryCategory, isPlainObject } from "@/lib/profile";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import {
  createInquiryRecord,
  listInquiryRecords,
} from "@/lib/server/profile-repository";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  CreateInquiryRequest,
  InquiryListPayload,
  InquiryPayload,
  ProfileErrorCode,
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
          message: "문의 내역을 조회하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const items = await listInquiryRecords(authContext.user);

  return NextResponse.json<ApiSuccess<InquiryListPayload>>({
    success: true,
    data: {
      items,
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
          message: "문의를 제출하려면 로그인해야 합니다.",
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !isPlainObject(body) ||
    !isInquiryCategory(body.category) ||
    typeof body.subject !== "string" ||
    body.subject.trim().length === 0 ||
    typeof body.message !== "string" ||
    body.message.trim().length === 0 ||
    (body.contactEmail !== undefined &&
      body.contactEmail !== null &&
      (typeof body.contactEmail !== "string" ||
        !isValidEmail(body.contactEmail.trim())))
  ) {
    return NextResponse.json<ApiError<ProfileErrorCode>>(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "문의 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const inquiry = await createInquiryRecord(
    authContext.user,
    body as CreateInquiryRequest,
  );

  return NextResponse.json<ApiSuccess<InquiryPayload>>(
    {
      success: true,
      data: {
        inquiry,
        dataSource: getIdentityDataSource(),
      },
    },
    { status: 201 },
  );
}
