"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import {
  applyAiSuggestionToDraft,
  buildDraftFromResume,
  buildPayloadFromDraft,
  buildPreviewResume,
  buildResumeAiRunContext,
  formatExperienceLabel,
  formatProjectLabel,
  getResumeAiCurrentSource,
  parseExperienceText,
  parseLinksText,
  parseProjectsText,
  resumeAiTargetOptions,
  resolveSelectedIndex,
  type ResumeAiCurrentSource,
  type ResumeAiRunContext,
} from "@/lib/resume-ai-assist";
import { buildResumeCompleteness, normalizeExternalLinks } from "@/lib/profile";
import type { ResumeWorkspaceViewModel } from "@/lib/resume-workspace/adapter";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  AiSuggestion,
  AiSuggestionJob,
  AiSuggestionJobPayload,
  ResumeAiSuggestionTarget,
} from "@/types/ai";
import type { ResumePayload, ResumeVisibility } from "@/types/profile";
import { resumeVisibilityValues } from "@/types/profile";

type ResumeWorkspaceProps = {
  model: ResumeWorkspaceViewModel;
};

type ResumeWorkspaceGuestModel = Extract<
  ResumeWorkspaceViewModel,
  { status: "guest" }
>;

type ResumeWorkspaceReadyModel = Extract<
  ResumeWorkspaceViewModel,
  { status: "ready" }
>;

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readApiResult<T>(response: Response) {
  return (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiError
    | null;
}

function getApiErrorMessage(
  result: ApiSuccess<unknown> | ApiError | null,
  fallback: string,
) {
  if (result && !result.success) {
    return result.error.message;
  }

  return fallback;
}

function formatResumeTimestamp(value: string) {
  return dateFormatter.format(new Date(value));
}

function getVisibilityLabel(value: ResumeVisibility) {
  return value === "shared" ? "공개" : "비공개";
}

function getAiTargetLabel(target: AiSuggestion["target"]) {
  return (
    resumeAiTargetOptions.find((option) => option.target === target)?.label ??
    target
  );
}

function getAiSuggestionConfidenceLabel(confidence: AiSuggestion["confidence"]) {
  switch (confidence) {
    case "high":
      return "신뢰 높음";
    case "medium":
      return "신뢰 보통";
    default:
      return "신뢰 낮음";
  }
}

function getAiJobStatusLabel(status: AiSuggestionJob["status"]) {
  switch (status) {
    case "queued":
      return "요청 접수";
    case "running":
      return "생성 중";
    case "succeeded":
      return "제안 준비";
    case "failed":
      return "재시도 필요";
    default:
      return status;
  }
}

function getAiJobStatusTone(status: AiSuggestionJob["status"]) {
  switch (status) {
    case "succeeded":
      return "bg-[color:var(--teal-soft)] text-[color:var(--teal)]";
    case "failed":
      return "bg-rose-100 text-rose-700";
    case "running":
      return "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getAiConfidenceTone(confidence: AiSuggestion["confidence"]) {
  switch (confidence) {
    case "high":
      return "bg-[color:var(--teal-soft)] text-[color:var(--teal)]";
    case "medium":
      return "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function canApplySuggestion(suggestion: AiSuggestion) {
  return suggestion.target !== "resume_full_review";
}

function SourcePreview({
  source,
  emptyText,
}: {
  source: ResumeAiCurrentSource;
  emptyText: string;
}) {
  if (source.valueType === "string_list") {
    return source.list.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {source.list.map((item) => (
          <span
            key={item}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm leading-7 text-[color:var(--muted)]">{emptyText}</p>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--muted)]">
      {source.text || emptyText}
    </p>
  );
}

export function ResumeWorkspace({ model }: ResumeWorkspaceProps) {
  return model.status === "guest" ? (
    <ResumeWorkspaceGuest model={model} />
  ) : (
    <ResumeWorkspaceReady model={model} />
  );
}

function ResumeWorkspaceGuest({ model }: { model: ResumeWorkspaceGuestModel }) {
  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong mesh rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">{model.badge}</span>
            <h1 className="section-title text-slate-950">{model.title}</h1>
            <p className="section-subtitle">{model.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login?next=%2Fresume" className="button-primary">
              로그인하고 AI 이력서 열기
            </Link>
            <Link href="/profile" className="button-ghost">
              프로필 셸 보기
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {model.previewCards.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel rounded-[1.8rem] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Completeness Contract
          </p>
          <div className="mt-4 grid gap-3">
            {model.sectionDefinitions.map((section) => (
              <div
                key={section.key}
                className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {section.label}
                  </p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    pending
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Resume Notes
            </p>
            <div className="mt-4 grid gap-3">
              {model.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              AI Assist Scope
            </p>
            <div className="mt-4 grid gap-3">
              {model.replacementPoints.map((point) => (
                <div
                  key={point.id}
                  className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {point.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResumeWorkspaceReady({ model }: { model: ResumeWorkspaceReadyModel }) {
  const [savedResume, setSavedResume] = useState(model.resume);
  const [savedCompleteness, setSavedCompleteness] = useState(model.completeness);
  const [draft, setDraft] = useState(() => buildDraftFromResume(model.resume));
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const [aiTarget, setAiTarget] =
    useState<ResumeAiSuggestionTarget>("resume_summary");
  const [aiInstruction, setAiInstruction] = useState("");
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState(0);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [aiJob, setAiJob] = useState<AiSuggestionJob | null>(null);
  const [lastAiRun, setLastAiRun] = useState<ResumeAiRunContext | null>(null);
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [isSavePending, startSaveTransition] = useTransition();
  const aiRunIdRef = useRef(0);
  const deferredDraft = useDeferredValue(draft);

  useEffect(() => {
    return () => {
      aiRunIdRef.current += 1;
    };
  }, []);

  const previewResume = buildPreviewResume(savedResume, deferredDraft);
  const liveResume = buildPreviewResume(savedResume, draft);
  const previewCompleteness = buildResumeCompleteness(previewResume);
  const savedSnapshot = JSON.stringify(
    buildPayloadFromDraft(buildDraftFromResume(savedResume)),
  );
  const draftSnapshot = JSON.stringify(buildPayloadFromDraft(draft));
  const isDirty = savedSnapshot !== draftSnapshot;

  const parsedLinks = parseLinksText(draft.linksText);
  const parsedExperience = parseExperienceText(draft.experienceText);
  const parsedProjects = parseProjectsText(draft.projectsText);
  const resolvedExperienceIndex = resolveSelectedIndex(
    parsedExperience.length,
    selectedExperienceIndex,
  );
  const resolvedProjectIndex = resolveSelectedIndex(
    parsedProjects.length,
    selectedProjectIndex,
  );
  const aiTargetOption =
    resumeAiTargetOptions.find((option) => option.target === aiTarget) ??
    resumeAiTargetOptions[0];
  const currentAiSource = getResumeAiCurrentSource({
    target: aiTarget,
    draft,
    parsedExperience,
    parsedProjects,
    selectedExperienceIndex: resolvedExperienceIndex,
    selectedProjectIndex: resolvedProjectIndex,
  });
  const resultSource = getResumeAiCurrentSource({
    target: lastAiRun?.target ?? aiTarget,
    draft,
    parsedExperience,
    parsedProjects,
    selectedExperienceIndex: lastAiRun?.experienceIndex ?? resolvedExperienceIndex,
    selectedProjectIndex: lastAiRun?.projectIndex ?? resolvedProjectIndex,
  });
  const aiSuggestions =
    aiJob?.status === "succeeded" ? aiJob.result?.suggestions ?? [] : [];
  const selectedExperience =
    resolvedExperienceIndex === null ? null : parsedExperience[resolvedExperienceIndex];
  const selectedProject =
    resolvedProjectIndex === null ? null : parsedProjects[resolvedProjectIndex];
  const canRetryAi =
    Boolean(lastAiRun) &&
    !isAiBusy &&
    (Boolean(aiError) || aiJob?.status === "failed");

  const mergeProfileLinks = () => {
    const nextLinks = normalizeExternalLinks([
      ...parseLinksText(draft.linksText),
      ...model.profile.links,
    ]);

    setDraft((current) => ({
      ...current,
      linksText: nextLinks
        .map((item) => [item.label, item.type, item.url].join(" | "))
        .join("\n"),
    }));
    setWorkspaceNotice("프로필 링크를 이력서 링크 편집기에 가져왔습니다.");
    setWorkspaceError("");
  };

  const applyProfileHeadline = () => {
    if (!model.profile.headline.trim()) {
      setWorkspaceNotice("프로필 헤드라인이 아직 없어 바로 가져올 초안이 없습니다.");
      setWorkspaceError("");
      return;
    }

    setDraft((current) => ({
      ...current,
      summary: current.summary.trim()
        ? `${model.profile.headline}\n\n${current.summary}`
        : model.profile.headline,
    }));
    setWorkspaceNotice("프로필 헤드라인을 이력서 요약 초안으로 가져왔습니다.");
    setWorkspaceError("");
  };

  const handleSave = () => {
    setWorkspaceError("");
    setWorkspaceNotice("");

    startSaveTransition(async () => {
      const response = await fetch("/api/resume", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayloadFromDraft(draft)),
      });

      const result = await readApiResult<ResumePayload>(response);

      if (!response.ok || !result?.success) {
        setWorkspaceError(
          getApiErrorMessage(result, "이력서 저장에 실패했습니다."),
        );
        return;
      }

      setSavedResume(result.data.resume);
      setSavedCompleteness(result.data.completeness);
      setDraft(buildDraftFromResume(result.data.resume));
      setWorkspaceNotice(
        "이력서를 저장했습니다. completeness와 draft가 다시 동기화되었습니다.",
      );
    });
  };

  const runAiSuggestions = async (runContext: ResumeAiRunContext) => {
    const runId = aiRunIdRef.current + 1;
    aiRunIdRef.current = runId;
    setIsAiBusy(true);
    setAiError("");
    setAiNotice("");
    setAiJob(null);
    setLastAiRun(runContext);

    try {
      const createResponse = await fetch("/api/ai/suggestions/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(runContext.request),
      });

      const createResult = await readApiResult<AiSuggestionJobPayload>(
        createResponse,
      );

      if (!createResponse.ok || !createResult?.success) {
        throw new Error(
          getApiErrorMessage(createResult, "AI suggestion 요청을 시작하지 못했습니다."),
        );
      }

      if (runId !== aiRunIdRef.current) {
        return;
      }

      let nextJob = createResult.data.job;
      setAiJob(nextJob);

      while (
        runId === aiRunIdRef.current &&
        (nextJob.status === "queued" || nextJob.status === "running")
      ) {
        await wait(900);

        const pollResponse = await fetch(`/api/ai/suggestions/jobs/${nextJob.id}`, {
          cache: "no-store",
        });
        const pollResult = await readApiResult<AiSuggestionJobPayload>(pollResponse);

        if (!pollResponse.ok || !pollResult?.success) {
          throw new Error(
            getApiErrorMessage(
              pollResult,
              "AI suggestion 상태를 다시 확인하지 못했습니다.",
            ),
          );
        }

        nextJob = pollResult.data.job;

        if (runId !== aiRunIdRef.current) {
          return;
        }

        setAiJob(nextJob);
      }

      if (runId !== aiRunIdRef.current) {
        return;
      }

      if (nextJob.status === "failed") {
        setAiError(nextJob.error?.message ?? "AI suggestion 생성에 실패했습니다.");
        return;
      }

      setAiNotice(
        "AI 제안이 준비되었습니다. 미리보기를 확인한 뒤 원하는 제안을 초안에 반영하세요.",
      );
    } catch (error) {
      if (runId !== aiRunIdRef.current) {
        return;
      }

      setAiError(
        error instanceof Error
          ? error.message
          : "AI suggestion을 불러오지 못했습니다.",
      );
    } finally {
      if (runId === aiRunIdRef.current) {
        setIsAiBusy(false);
      }
    }
  };

  const handleGenerateAi = () => {
    const nextRun = buildResumeAiRunContext({
      target: aiTarget,
      instruction: aiInstruction,
      locale:
        typeof navigator === "undefined" ? "ko-KR" : navigator.language ?? "ko-KR",
      resume: liveResume,
      profile: model.profile,
      onboarding: model.onboarding,
      parsedExperience,
      parsedProjects,
      selectedExperienceIndex: resolvedExperienceIndex,
      selectedProjectIndex: resolvedProjectIndex,
    });

    if (!nextRun.success) {
      setAiError(nextRun.message);
      setAiNotice("");
      return;
    }

    void runAiSuggestions(nextRun.context);
  };

  const handleRetryAi = () => {
    if (!lastAiRun) {
      setAiError("다시 실행할 최근 AI 요청이 없습니다.");
      return;
    }

    void runAiSuggestions(lastAiRun);
  };

  const handleApplySuggestion = (suggestion: AiSuggestion) => {
    const applied = applyAiSuggestionToDraft({
      draft,
      parsedExperience,
      parsedProjects,
      suggestion,
      runContext: lastAiRun,
    });

    if (!applied.success) {
      setAiError(applied.message);
      return;
    }

    setDraft(applied.draft);
    setAiNotice(applied.message);
    setWorkspaceNotice(
      "AI 제안은 현재 draft에만 반영되었습니다. 저장 버튼을 눌러 이력서에 확정하세요.",
    );
    setAiError("");
    setWorkspaceError("");
  };

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong mesh rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">{model.badge}</span>
            <h1 className="section-title text-slate-950">{model.title}</h1>
            <p className="section-subtitle">{model.subtitle}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/profile" className="button-ghost">
              프로필 셸 열기
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSavePending}
              className="button-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavePending ? "저장 중..." : isDirty ? "변경사항 저장" : "저장 완료"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Preview Score", `${previewCompleteness.score}%`],
            ["Saved Score", `${savedCompleteness.score}%`],
            ["Visibility", getVisibilityLabel(previewResume.visibility)],
            [
              "AI Target",
              lastAiRun ? getAiTargetLabel(lastAiRun.target) : getAiTargetLabel(aiTarget),
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-white/75 bg-white/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                마지막 저장 {formatResumeTimestamp(savedResume.updatedAt)}
              </p>
              <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">
                데이터 소스 {model.dataSource} · {previewCompleteness.completedSections.length} /{" "}
                {model.sectionDefinitions.length} 섹션 완료
              </p>
            </div>
            <div className="rounded-full bg-[color:var(--teal-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--teal)]">
              {previewCompleteness.missingSections.length === 0
                ? "완료"
                : `${previewCompleteness.missingSections.length}개 보강 필요`}
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,var(--accent),var(--teal))]"
              style={{ width: `${previewCompleteness.score}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Core Resume
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                이력서 제목
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="field"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                공개 범위
                <select
                  value={draft.visibility}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      visibility: event.target.value as ResumeVisibility,
                    }))
                  }
                  className="field"
                >
                  {resumeVisibilityValues.map((value) => (
                    <option key={value} value={value}>
                      {getVisibilityLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-800">
              요약 소개
              <textarea
                value={draft.summary}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                className="field textarea"
                placeholder="짧은 소개와 현재 기여 포인트를 적어주세요."
              />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                핵심 스킬
                <input
                  value={draft.skillsText}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      skillsText: event.target.value,
                    }))
                  }
                  className="field"
                  placeholder="예: Next.js, TypeScript, Prisma"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                학력 / 소속
                <input
                  value={draft.education}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      education: event.target.value,
                    }))
                  }
                  className="field"
                  placeholder={model.user.campus ?? "예: Krafton Jungle"}
                />
              </label>
            </div>

            {workspaceError ? (
              <div className="mt-4 rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {workspaceError}
              </div>
            ) : null}
            {workspaceNotice ? (
              <div className="mt-4 rounded-[1.25rem] bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                {workspaceNotice}
              </div>
            ) : null}
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Section Editors
            </p>
            <div className="mt-5 space-y-5">
              <label className="block space-y-2 text-sm font-semibold text-slate-800">
                경험 편집기
                <textarea
                  value={draft.experienceText}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      experienceText: event.target.value,
                    }))
                  }
                  className="field textarea"
                  placeholder="조직 | 역할 | 시작 | 종료 | 설명"
                />
                <p className="text-xs font-medium leading-6 text-[color:var(--muted)]">
                  한 줄에 한 항목씩 입력합니다. 현재 {parsedExperience.length}개 항목이
                  감지되었습니다.
                </p>
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-800">
                프로젝트 편집기
                <textarea
                  value={draft.projectsText}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      projectsText: event.target.value,
                    }))
                  }
                  className="field textarea"
                  placeholder="프로젝트명 | 설명 | 기술1, 기술2 | 링크"
                />
                <p className="text-xs font-medium leading-6 text-[color:var(--muted)]">
                  한 줄에 한 항목씩 입력합니다. 현재 {parsedProjects.length}개 항목이
                  감지되었습니다.
                </p>
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-800">
                링크 편집기
                <textarea
                  value={draft.linksText}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      linksText: event.target.value,
                    }))
                  }
                  className="field textarea"
                  placeholder="라벨 | github | https://example.com"
                />
                <p className="text-xs font-medium leading-6 text-[color:var(--muted)]">
                  한 줄에 한 링크씩 입력합니다. 현재 {parsedLinks.length}개 링크가
                  감지되었습니다.
                </p>
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                AI Resume Assist
              </p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                /api/ai/suggestions/jobs
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                <strong className="text-slate-950">{model.user.displayName}</strong>
                <br />
                {model.user.email}
                {model.user.campus ? ` · ${model.user.campus}` : ""}
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                프로필 헤드라인: {model.profile.headline || "미입력"}
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                관심 역할:{" "}
                {model.profile.openToRoles.length > 0
                  ? model.profile.openToRoles.join(", ")
                  : "미입력"}
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                온보딩 키워드:{" "}
                {model.onboarding.interestKeywords.length > 0
                  ? model.onboarding.interestKeywords.join(", ")
                  : "미입력"}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={applyProfileHeadline}
                className="button-secondary w-full"
              >
                프로필 헤드라인을 요약으로 가져오기
              </button>
              <button
                type="button"
                onClick={mergeProfileLinks}
                className="button-ghost w-full"
              >
                프로필 링크를 이력서에 합치기
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {resumeAiTargetOptions.map((option) => {
                const active = option.target === aiTarget;

                return (
                  <button
                    key={option.target}
                    type="button"
                    onClick={() => {
                      setAiTarget(option.target);
                      setAiError("");
                    }}
                    className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                      active
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60"
                        : "border-slate-200/80 bg-white/82"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {aiTarget === "resume_experience" ? (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  경험 항목 선택
                </p>
                <div className="grid gap-2">
                  {parsedExperience.length > 0 ? (
                    parsedExperience.map((item, index) => {
                      const active = resolvedExperienceIndex === index;

                      return (
                        <button
                          key={`${item.organization}-${item.role}-${index}`}
                          type="button"
                          onClick={() => setSelectedExperienceIndex(index)}
                          className={`rounded-[1.1rem] border px-4 py-3 text-left ${
                            active
                              ? "border-[color:var(--teal)] bg-[color:var(--teal-soft)]"
                              : "border-slate-200/80 bg-white/82"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {formatExperienceLabel(item, index)}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                            {item.description || "설명이 아직 비어 있습니다."}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.1rem] border border-dashed border-slate-300 bg-white/72 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                      경험 항목을 한 줄 이상 입력하면 해당 항목을 선택해 AI 문장 제안을 만들 수 있습니다.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {aiTarget === "resume_project" ? (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  프로젝트 항목 선택
                </p>
                <div className="grid gap-2">
                  {parsedProjects.length > 0 ? (
                    parsedProjects.map((item, index) => {
                      const active = resolvedProjectIndex === index;

                      return (
                        <button
                          key={`${item.title}-${index}`}
                          type="button"
                          onClick={() => setSelectedProjectIndex(index)}
                          className={`rounded-[1.1rem] border px-4 py-3 text-left ${
                            active
                              ? "border-[color:var(--teal)] bg-[color:var(--teal-soft)]"
                              : "border-slate-200/80 bg-white/82"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {formatProjectLabel(item, index)}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                            {item.description || "설명이 아직 비어 있습니다."}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.1rem] border border-dashed border-slate-300 bg-white/72 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                      프로젝트 항목을 한 줄 이상 입력하면 해당 항목을 선택해 AI 스토리 제안을 만들 수 있습니다.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">현재 생성 기준</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {currentAiSource.label}
                </span>
              </div>
              <div className="mt-3">
                <SourcePreview
                  source={currentAiSource}
                  emptyText="현재 초안이 비어 있어 AI가 프로필/온보딩 맥락을 우선 참고합니다."
                />
              </div>
            </div>

            <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-800">
              AI 요청 가이드
              <textarea
                value={aiInstruction}
                onChange={(event) => setAiInstruction(event.target.value)}
                className="field textarea"
                placeholder={aiTargetOption.instructionPlaceholder}
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isAiBusy}
                className="button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAiBusy ? "AI 생성 중..." : `${aiTargetOption.label} 제안 만들기`}
              </button>
              <button
                type="button"
                onClick={handleRetryAi}
                disabled={!canRetryAi}
                className="button-ghost flex-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                마지막 요청 다시 실행
              </button>
            </div>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                AI Suggestions
              </p>
              {aiJob ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getAiJobStatusTone(aiJob.status)}`}
                >
                  {getAiJobStatusLabel(aiJob.status)}
                </span>
              ) : null}
            </div>

            {lastAiRun ? (
              <div className="mt-4 rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                마지막 요청 대상:{" "}
                <strong className="text-slate-950">
                  {getAiTargetLabel(lastAiRun.target)}
                </strong>
                {` · ${lastAiRun.sourceLabel}`}
                {aiJob ? ` · provider ${aiJob.provider}` : ""}
              </div>
            ) : null}

            {aiError ? (
              <div className="mt-4 rounded-[1.2rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {aiError}
              </div>
            ) : null}
            {aiNotice ? (
              <div className="mt-4 rounded-[1.2rem] bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                {aiNotice}
              </div>
            ) : null}

            {!aiJob && !aiError ? (
              <div className="mt-4 rounded-[1.2rem] border border-dashed border-slate-300 bg-white/72 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                오른쪽 컨텍스트에서 target과 항목을 고른 뒤 AI suggestion job을 시작하면,
                Phase 3 job status와 suggestion preview를 여기에서 그대로 확인할 수 있습니다.
              </div>
            ) : null}

            {aiJob?.status === "queued" || aiJob?.status === "running" ? (
              <div className="mt-4 rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {getAiJobStatusLabel(aiJob.status)}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--muted)]">
                    {formatResumeTimestamp(aiJob.updatedAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {aiJob.status === "queued"
                    ? "job이 접수되었습니다. 다음 polling 응답에서 running 또는 succeeded 상태로 전이됩니다."
                    : "provider가 현재 초안을 읽고 suggestion을 만들고 있습니다."}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(135deg,var(--accent),var(--teal))]" />
                </div>
              </div>
            ) : null}

            {aiSuggestions.length > 0 ? (
              <div className="mt-4 grid gap-4">
                {aiSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-[1.25rem] border border-slate-200/80 bg-white/82 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {suggestion.label}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--muted)]">
                          {suggestion.action} · {getAiTargetLabel(suggestion.target)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getAiConfidenceTone(suggestion.confidence)}`}
                      >
                        {getAiSuggestionConfidenceLabel(suggestion.confidence)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                      {suggestion.rationale}
                    </p>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[1rem] bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Current Draft
                        </p>
                        <div className="mt-3">
                          <SourcePreview
                            source={resultSource}
                            emptyText="아직 해당 섹션 초안이 비어 있습니다."
                          />
                        </div>
                      </div>
                      <div className="rounded-[1rem] bg-[color:var(--accent-soft)]/45 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                          Suggested Update
                        </p>
                        <div className="mt-3">
                          <SourcePreview
                            source={{
                              label: suggestion.label,
                              valueType: suggestion.valueType,
                              text:
                                suggestion.valueType === "text" ? suggestion.value : "",
                              list:
                                suggestion.valueType === "string_list"
                                  ? suggestion.value
                                  : [],
                            }}
                            emptyText="제안 값이 비어 있습니다."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={!canApplySuggestion(suggestion)}
                        className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {canApplySuggestion(suggestion)
                          ? "초안에 반영"
                          : "검토용 제안"}
                      </button>
                      {!canApplySuggestion(suggestion) ? (
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                          full review는 직접 수정 가이드로만 사용합니다.
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Completeness Breakdown
            </p>
            <div className="mt-4 grid gap-3">
              {model.sectionDefinitions.map((section) => {
                const complete = previewCompleteness.completedSections.includes(
                  section.key,
                );

                return (
                  <div
                    key={section.key}
                    className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">
                        {section.label}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          complete
                            ? "bg-[color:var(--teal-soft)] text-[color:var(--teal)]"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {complete ? "complete" : "missing"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                      {section.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Workspace Notes
            </p>
            <div className="mt-4 grid gap-3">
              {model.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Current Selection
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                요약 소개 길이:{" "}
                {draft.summary.trim().length > 0
                  ? `${draft.summary.trim().length}자`
                  : "미입력"}
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                선택된 경험:{" "}
                {selectedExperience && resolvedExperienceIndex !== null
                  ? formatExperienceLabel(selectedExperience, resolvedExperienceIndex)
                  : "없음"}
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                선택된 프로젝트:{" "}
                {selectedProject && resolvedProjectIndex !== null
                  ? formatProjectLabel(selectedProject, resolvedProjectIndex)
                  : "없음"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
