"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PostCard } from "@/components/post-card";
import { addStoredPost } from "@/lib/storage";
import type { CreateRecruitPostInput, RecruitPost } from "@/types/recruit";

type CurrentUser = {
  id: string;
  displayName: string;
};

type DraftState = {
  category: RecruitPost["category"];
  title: string;
  campus: string;
  summary: string;
  description: string;
  rolesText: string;
  techStackText: string;
  capacity: string;
  stage: string;
  deadline: string;
  ownerName: string;
  ownerRole: string;
  meetingStyle: string;
  schedule: string;
  goal: string;
};

const initialDraft = (): DraftState => ({
  category: "project",
  title: "",
  campus: "서울 캠퍼스",
  summary: "",
  description: "",
  rolesText: "",
  techStackText: "",
  capacity: "2",
  stage: "아이디어 검증",
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10)
    .toISOString()
    .slice(0, 10),
  ownerName: "",
  ownerRole: "",
  meetingStyle: "온·오프라인 혼합",
  schedule: "",
  goal: "",
});

const sampleDraft: DraftState = {
  category: "project",
  title: "캠퍼스 네트워킹 앱 데모 팀원 모집",
  campus: "판교 캠퍼스",
  summary: "2주 안에 온보딩부터 데모까지 완성할 집중형 프로젝트입니다.",
  description:
    "발표용으로도 잘 보이는 웹 서비스 데모를 빠르게 완성하려고 합니다. 프론트엔드 1명, 백엔드 1명, 기획/디자인 1명을 추가 모집합니다.",
  rolesText: "Frontend, Backend, Product Designer",
  techStackText: "Next.js, TypeScript, Tailwind CSS, Node.js",
  capacity: "3",
  stage: "MVP 제작 중",
  deadline: "2026-03-27",
  ownerName: "정글 팀장",
  ownerRole: "PM / Frontend",
  meetingStyle: "오프라인 중심",
  schedule: "평일 저녁 3회 + 주말 스프린트 1회",
  goal: "Vercel 배포까지 마친 발표용 서비스 완성",
};

function toPreviewPost(draft: DraftState): RecruitPost {
  const roles = draft.rolesText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const techStack = draft.techStackText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: "preview",
    slug: "preview",
    title: draft.title || "새 모집글 제목이 여기에 표시됩니다",
    category: draft.category,
    campus: draft.campus || "캠퍼스 정보",
    summary: draft.summary || "모집글 카드에 보일 요약 문장을 입력해 주세요.",
    description:
      draft.description ||
      "상세 화면에 노출될 팀 소개와 진행 맥락을 조금 더 자세히 적어주세요.",
    roles: roles.length > 0 ? roles : ["모집 역할"],
    techStack: techStack.length > 0 ? techStack : ["기술 스택"],
    capacity: Number(draft.capacity || "1"),
    currentMembers: 2,
    stage: draft.stage || "진행 단계",
    deadline: draft.deadline,
    createdAt: new Date().toISOString(),
    highlight: true,
    ownerName: draft.ownerName || "팀장 이름",
    ownerRole: draft.ownerRole || "팀장 역할",
    meetingStyle: draft.meetingStyle || "진행 방식",
    schedule: draft.schedule || "활동 일정",
    goal: draft.goal || "이번 팀의 목표를 입력해 주세요.",
    expectations: [
      "정기 참여가 가능한 팀원",
      "문서화와 커뮤니케이션에 적극적인 팀원",
    ],
    perks: ["발표 가능한 데모 완성", "포트폴리오용 결과물 확보"],
  };
}

type CreatePostFormProps = {
  currentUser: CurrentUser;
};

export function CreatePostForm({ currentUser }: CreatePostFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(() => ({
    ...initialDraft(),
    ownerName: currentUser.displayName,
  }));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const previewPost = toPreviewPost(draft);

  const updateField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const roles = draft.rolesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const techStack = draft.techStackText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      !draft.title.trim() ||
      !draft.summary.trim() ||
      !draft.description.trim() ||
      roles.length === 0 ||
      !draft.deadline
    ) {
      setError("제목, 요약, 설명, 역할, 마감일은 필수입니다.");
      return;
    }

    startTransition(async () => {
      const payload: CreateRecruitPostInput = {
        category: draft.category,
        title: draft.title.trim(),
        campus: draft.campus.trim(),
        summary: draft.summary.trim(),
        description: draft.description.trim(),
        roles,
        techStack,
        capacity: Number(draft.capacity || "1"),
        stage: draft.stage.trim(),
        deadline: draft.deadline,
        ownerName: draft.ownerName.trim() || "새 팀장",
        ownerRole: draft.ownerRole.trim() || "프로젝트 리드",
        meetingStyle: draft.meetingStyle.trim() || "온·오프라인 혼합",
        schedule: draft.schedule.trim() || "세부 일정 협의",
        goal: draft.goal.trim() || "데모 완성",
        ownerId: currentUser.id,
      };

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: {
          id: string;
          slug: string;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !result.success || !result.data) {
        setError(result.error?.message ?? "모집글 생성에 실패했습니다.");
        return;
      }

      const createdPost: RecruitPost = {
        ...previewPost,
        id: result.data.id,
        slug: result.data.slug,
        createdAt: new Date().toISOString(),
        ownerId: currentUser.id,
      };

      addStoredPost(createdPost);
      router.push(`/recruit/${createdPost.slug}?created=1`);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={submit} className="panel rounded-[1.8rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Write Form
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              모집글 입력
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDraft(sampleDraft)}
            className="button-ghost px-4 py-2 text-sm"
          >
            샘플 자동 입력
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              모집 유형
              <select
                value={draft.category}
                onChange={(event) =>
                  updateField("category", event.target.value as RecruitPost["category"])
                }
                className="field"
              >
                <option value="study">스터디</option>
                <option value="project">프로젝트</option>
                <option value="hackathon">해커톤</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              캠퍼스
              <input
                value={draft.campus}
                onChange={(event) => updateField("campus", event.target.value)}
                className="field"
                placeholder="예: 서울 캠퍼스"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            제목
            <input
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="field"
              placeholder="예: AI 서비스 데모 팀원 모집"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            카드 요약
            <input
              value={draft.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              className="field"
              placeholder="목록 카드에 보일 한 줄 설명"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            상세 설명
            <textarea
              value={draft.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="field textarea"
              placeholder="팀이 어떤 목표를 가지고 있고 어떤 사람을 찾는지 적어주세요"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              모집 역할
              <input
                value={draft.rolesText}
                onChange={(event) => updateField("rolesText", event.target.value)}
                className="field"
                placeholder="예: Frontend, Backend"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              기술 스택
              <input
                value={draft.techStackText}
                onChange={(event) => updateField("techStackText", event.target.value)}
                className="field"
                placeholder="예: Next.js, Node.js"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              모집 인원
              <input
                type="number"
                min="1"
                max="20"
                value={draft.capacity}
                onChange={(event) => updateField("capacity", event.target.value)}
                className="field"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              진행 단계
              <input
                value={draft.stage}
                onChange={(event) => updateField("stage", event.target.value)}
                className="field"
                placeholder="예: 아이디어 검증"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              마감일
              <input
                type="date"
                value={draft.deadline}
                onChange={(event) => updateField("deadline", event.target.value)}
                className="field"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              팀장 이름
              <input
                value={draft.ownerName}
                onChange={(event) => updateField("ownerName", event.target.value)}
                className="field"
                placeholder="예: 홍길동"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              팀장 역할
              <input
                value={draft.ownerRole}
                onChange={(event) => updateField("ownerRole", event.target.value)}
                className="field"
                placeholder="예: PM / Frontend"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              진행 방식
              <input
                value={draft.meetingStyle}
                onChange={(event) => updateField("meetingStyle", event.target.value)}
                className="field"
                placeholder="예: 온·오프라인 혼합"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              활동 일정
              <input
                value={draft.schedule}
                onChange={(event) => updateField("schedule", event.target.value)}
                className="field"
                placeholder="예: 주 2회 저녁 8시"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            이번 팀의 목표
            <input
              value={draft.goal}
              onChange={(event) => updateField("goal", event.target.value)}
              className="field"
              placeholder="예: 3주 안에 배포 가능한 데모 완성"
            />
          </label>

          {error ? (
            <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "모집글 생성 중..." : "모집글 생성하기"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Live Preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            카드 미리보기
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            입력한 내용을 기준으로 실제 목록 카드가 어떻게 보일지 바로 확인할 수
            있습니다.
          </p>
        </div>
        <PostCard post={previewPost} />
      </div>
    </div>
  );
}
