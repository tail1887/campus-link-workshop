import { NextResponse } from "next/server";
import {
  buildSlugFromTitle,
  filterPosts,
  validateRecruitPostInput,
} from "@/lib/recruit";
import { normalizeText } from "@/lib/identity";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
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
  const authContext = await getCurrentAuthContext();
  const body = (await request.json()) as Partial<CreateRecruitPostInput>;
  const category =
    body.category === "study" ||
    body.category === "project" ||
    body.category === "hackathon"
      ? body.category
      : null;
  const roles = Array.isArray(body.roles)
    ? body.roles.map(normalizeText).filter(Boolean)
    : [];
  const techStack = Array.isArray(body.techStack)
    ? body.techStack.map(normalizeText).filter(Boolean)
    : [];
  const normalizedInput: CreateRecruitPostInput = {
    category: category ?? "project",
    title: normalizeText(body.title ?? ""),
    campus: normalizeText(body.campus ?? ""),
    summary: normalizeText(body.summary ?? ""),
    description: normalizeText(body.description ?? ""),
    roles,
    techStack,
    capacity:
      typeof body.capacity === "number" && Number.isFinite(body.capacity)
        ? Math.trunc(body.capacity)
        : 1,
    stage: normalizeText(body.stage ?? "아이디어 검증") || "아이디어 검증",
    deadline: normalizeText(body.deadline ?? ""),
    ownerName: normalizeText(body.ownerName ?? "새 팀장") || "새 팀장",
    ownerRole:
      normalizeText(body.ownerRole ?? "프로젝트 리드") || "프로젝트 리드",
    meetingStyle:
      normalizeText(body.meetingStyle ?? "온·오프라인 혼합") ||
      "온·오프라인 혼합",
    schedule: normalizeText(body.schedule ?? "세부 일정 협의") || "세부 일정 협의",
    goal: normalizeText(body.goal ?? "데모 완성") || "데모 완성",
    ownerId: authContext.authenticated ? authContext.user.id : null,
  };
  const validationMessage =
    category === null
      ? "모집 유형을 올바르게 선택해주세요."
      : validateRecruitPostInput(normalizedInput);

  if (validationMessage) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: validationMessage,
        },
      },
      { status: 400 },
    );
  }

  const slug = buildSlugFromTitle(normalizedInput.title);
  const createdPost = await createRecruitPost({
    ...normalizedInput,
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
