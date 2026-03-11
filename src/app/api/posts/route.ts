import { NextResponse } from "next/server";
import {
  buildSlugFromTitle,
  filterPosts,
} from "@/lib/recruit";
import {
  createRecruitPost,
  getRecruitDataSource,
  listRecruitPosts,
} from "@/lib/server/recruit-repository";
import type { CreateRecruitPostInput, RecruitCategory } from "@/types/recruit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const campus = searchParams.get("campus");
  const q = searchParams.get("q");

  const posts = filterPosts(await listRecruitPosts(), {
    category:
      category === "study" || category === "project" || category === "hackathon"
        ? (category as RecruitCategory)
        : "all",
    campus: campus ?? "all",
    query: q ?? "",
  });

  return NextResponse.json({
    success: true,
    data: {
      items: posts,
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateRecruitPostInput>;

  if (
    !body.title ||
    !body.category ||
    !body.campus ||
    !body.summary ||
    !body.description ||
    !body.deadline ||
    !body.roles?.length
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "필수 입력값을 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const slug = buildSlugFromTitle(body.title);
  const createdPost = await createRecruitPost({
    category: body.category,
    title: body.title,
    campus: body.campus,
    summary: body.summary,
    description: body.description,
    roles: body.roles,
    techStack: body.techStack ?? [],
    capacity: body.capacity ?? 1,
    stage: body.stage ?? "아이디어 검증",
    deadline: body.deadline,
    ownerName: body.ownerName ?? "새 팀장",
    ownerRole: body.ownerRole ?? "프로젝트 리드",
    meetingStyle: body.meetingStyle ?? "온·오프라인 혼합",
    schedule: body.schedule ?? "세부 일정 협의",
    goal: body.goal ?? "데모 완성",
    slug,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: createdPost.id,
        slug: createdPost.slug,
        dataSource: getRecruitDataSource(),
        message:
          getRecruitDataSource() === "database"
            ? "모집글이 데이터베이스에 저장되었습니다."
            : "모집글이 mock 저장소에 생성되었습니다.",
      },
    },
    { status: 201 },
  );
}
