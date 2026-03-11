"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useState, useTransition } from "react";
import { PostCard } from "@/components/post-card";
import {
  buildPostAiAssistViewModel,
  type BranchLocalPostAssistDraft,
  buildRecruitPostSuggestionRequest,
  emptyPostAiAssistSuggestions,
  mapSuggestionResultsToPostAssistSuggestions,
  type PostAiAssistSuggestions,
  type PostAiAssistTarget,
} from "@/lib/post-ai-assist/adapter";
import { addStoredPost } from "@/lib/storage";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type { AiSuggestionJobPayload } from "@/types/ai";
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

function parseCommaSeparatedText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPostAssistDraft(draft: DraftState): BranchLocalPostAssistDraft {
  return {
    category: draft.category,
    title: draft.title,
    campus: draft.campus,
    summary: draft.summary,
    description: draft.description,
    roles: parseCommaSeparatedText(draft.rolesText),
    techStack: parseCommaSeparatedText(draft.techStackText),
    capacity: Number(draft.capacity || "1"),
    stage: draft.stage,
    deadline: draft.deadline,
    ownerRole: draft.ownerRole,
    meetingStyle: draft.meetingStyle,
    schedule: draft.schedule,
    goal: draft.goal,
  };
}

function toPreviewPost(draft: DraftState): RecruitPost {
  const roles = parseCommaSeparatedText(draft.rolesText);
  const techStack = parseCommaSeparatedText(draft.techStackText);

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
  const [notice, setNotice] = useState("");
  const [suggestions, setSuggestions] =
    useState<PostAiAssistSuggestions | null>(null);
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [isAssistPending, startAssistTransition] = useTransition();
  const deferredDraft = useDeferredValue(draft);

  const previewPost = toPreviewPost(deferredDraft);
  const assistDraft = buildPostAssistDraft(deferredDraft);
  const assistModel = buildPostAiAssistViewModel(assistDraft);

  const updateField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const pollSuggestionJob = async (jobId: string) => {
    let attempt = 0;

    while (attempt < 6) {
      const response = await fetch(`/api/ai/suggestions/jobs/${jobId}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as
        | ApiSuccess<AiSuggestionJobPayload>
        | ApiError<string>;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result
            ? result.error.message
            : "AI suggestion 상태를 불러오지 못했습니다.",
        );
      }

      if (result.data.job.status === "succeeded" && result.data.job.result) {
        return result.data.job.result;
      }

      if (result.data.job.status === "failed") {
        throw new Error(
          result.data.job.error?.message ?? "AI suggestion 생성에 실패했습니다.",
        );
      }

      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error("AI suggestion 결과를 기다리는 중 시간이 초과되었습니다.");
  };

  const applySuggestion = (
    target: PostAiAssistTarget,
    text: string,
    label: string,
  ) => {
    updateField(target, text);
    setNotice(`${label} 추천을 현재 draft에 반영했습니다.`);
    setError("");
  };

  const generateSuggestions = () => {
    setError("");
    setNotice("");

    startAssistTransition(async () => {
      try {
        const nextDraft = buildPostAssistDraft(draft);
        const locale =
          typeof window !== "undefined" ? window.navigator.language : "ko-KR";
        const targets: PostAiAssistTarget[] = ["title", "summary", "description"];

        const results = await Promise.all(
          targets.map(async (target) => {
            const response = await fetch("/api/ai/suggestions/jobs", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                buildRecruitPostSuggestionRequest({
                  draft: nextDraft,
                  target,
                  locale,
                }),
              ),
            });
            const result = (await response.json()) as
              | ApiSuccess<AiSuggestionJobPayload>
              | ApiError<string>;

            if (!response.ok || !result.success) {
              throw new Error(
                "error" in result
                  ? result.error.message
                  : "AI suggestion 요청에 실패했습니다.",
              );
            }

            return pollSuggestionJob(result.data.job.id);
          }),
        );

        const nextSuggestions = mapSuggestionResultsToPostAssistSuggestions(results);
        setSuggestions(nextSuggestions);
        setNotice(
          nextSuggestions.summaryNote || "공유 AI suggestion 초안을 불러왔습니다.",
        );
      } catch (requestError) {
        setSuggestions(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "AI suggestion 생성에 실패했습니다.",
        );
      }
    });
  };

  const applyTopSuggestions = () => {
    const nextSuggestions = suggestions ?? emptyPostAiAssistSuggestions();

    if (
      nextSuggestions.title.length === 0 &&
      nextSuggestions.summary.length === 0 &&
      nextSuggestions.description.length === 0
    ) {
      setNotice("먼저 추천 생성을 실행한 뒤 적용할 수 있습니다.");
      setError("");
      return;
    }

    setDraft((current) => ({
      ...current,
      title: nextSuggestions.title[0]?.text ?? current.title,
      summary: nextSuggestions.summary[0]?.text ?? current.summary,
      description: nextSuggestions.description[0]?.text ?? current.description,
    }));
    setNotice("제목, 요약, 설명에 추천 초안을 한 번에 적용했습니다.");
    setError("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const roles = parseCommaSeparatedText(draft.rolesText);
    const techStack = parseCommaSeparatedText(draft.techStackText);

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

    startSubmitTransition(async () => {
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
            onClick={() => {
              setDraft(sampleDraft);
              setNotice("샘플 draft를 불러왔습니다. 필요하면 바로 AI 추천을 생성해보세요.");
              setError("");
            }}
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
          {notice ? (
            <div className="rounded-[1.25rem] bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
              {notice}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitPending}
            className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitPending ? "모집글 생성 중..." : "모집글 생성하기"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                AI Assist
              </p>
              <h2 className="text-2xl font-semibold text-slate-950">
                {assistModel.title}
              </h2>
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                {assistModel.subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <span className="rounded-full bg-[color:var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--teal)]">
                {assistModel.badge}
              </span>
              <button
                type="button"
                onClick={generateSuggestions}
                disabled={isAssistPending}
                className="button-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAssistPending ? "추천 생성 중..." : "추천 생성"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {assistModel.contextCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={applyTopSuggestions}
              disabled={!suggestions}
              className="button-primary w-full sm:w-auto"
            >
              추천 3종 한 번에 적용
            </button>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              shared suggestion job API가 현재 draft를 읽어 제목, 요약, 설명 초안을 생성합니다.
            </p>
          </div>

          {suggestions ? (
            <div className="mt-5 space-y-4">
              {(
                [
                  ["title", "제목 추천", suggestions.title],
                  ["summary", "요약 추천", suggestions.summary],
                  ["description", "상세 설명 추천", suggestions.description],
                ] as const
              ).map(([target, heading, items]) => (
                <div
                  key={target}
                  className="rounded-[1.35rem] border border-slate-200/80 bg-white/82 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{heading}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      {items.length} options
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.1rem] border border-slate-200/80 bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              {item.label}
                            </p>
                            <p className="text-sm leading-7 text-slate-950 whitespace-pre-line">
                              {item.text}
                            </p>
                            <p className="text-xs leading-6 text-[color:var(--muted)]">
                              {item.rationale} · {item.confidence}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => applySuggestion(item.target, item.text, heading)}
                            className="button-ghost px-4 py-2 text-sm"
                          >
                            적용
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {suggestions.generatedAt ? (
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  최근 추천 생성 {new Date(suggestions.generatedAt).toLocaleString("ko-KR")}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {assistModel.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>

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

        <div className="panel rounded-[1.8rem] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            AI Replacement Points
          </p>
          <div className="mt-4 grid gap-3">
            {assistModel.replacementPoints.map((point) => (
              <div
                key={point.id}
                className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {point.title}
                  </p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {point.target}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
