import { NextResponse } from "next/server";
import {
  createRecruitApplication,
  findRecruitPost,
  getRecruitDataSource,
  hasDuplicateApplication,
} from "@/lib/server/recruit-repository";
import type { CreateRecruitApplicationInput } from "@/types/recruit";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const body = (await request.json()) as Partial<CreateRecruitApplicationInput>;
  const post = await findRecruitPost(slug);

  if (!post) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "POST_NOT_FOUND",
          message: "지원할 모집글을 찾을 수 없습니다.",
        },
      },
      { status: 404 },
    );
  }

  if (!body.name || !body.contact || !body.message) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "이름, 연락처, 메시지를 모두 입력해주세요.",
        },
      },
      { status: 400 },
    );
  }

  if (await hasDuplicateApplication(slug, body.contact)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DUPLICATE_APPLICATION",
          message: "이미 같은 연락처로 지원한 기록이 있습니다.",
        },
      },
      { status: 409 },
    );
  }

  const application = await createRecruitApplication({
    postSlug: slug,
    name: body.name,
    contact: body.contact,
    message: body.message,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        applicationId: application.id,
        postSlug: slug,
        dataSource: getRecruitDataSource(),
        message:
          getRecruitDataSource() === "database"
            ? "지원이 데이터베이스에 접수되었습니다. 팀장이 확인 후 연락할 예정입니다."
            : "지원이 접수되었습니다. 팀장이 확인 후 연락할 예정입니다.",
      },
    },
    { status: 202 },
  );
}
