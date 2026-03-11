import { NextResponse } from "next/server";
import { findRecruitPost } from "@/lib/server/recruit-repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const post = await findRecruitPost(slug);

  if (!post) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "POST_NOT_FOUND",
          message: "모집글을 찾을 수 없습니다.",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: post,
  });
}
