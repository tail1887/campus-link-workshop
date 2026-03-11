"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import { normalizeText } from "@/lib/identity";
import {
  buildResumeCompleteness,
  normalizeExternalLinks,
  normalizeResumeExperience,
  normalizeResumeProjects,
  normalizeStringList,
} from "@/lib/profile";
import type { ResumeWorkspaceViewModel } from "@/lib/resume-workspace/adapter";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  ExternalLink,
  ExternalLinkType,
  Resume,
  ResumeExperience,
  ResumePayload,
  ResumeProject,
  ResumeVisibility,
  UpdateResumeRequest,
} from "@/types/profile";
import {
  externalLinkTypeValues,
  resumeVisibilityValues,
} from "@/types/profile";

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

type ResumeDraft = {
  title: string;
  summary: string;
  skillsText: string;
  education: string;
  experienceText: string;
  projectsText: string;
  linksText: string;
  visibility: ResumeVisibility;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function serializeExperience(values: ResumeExperience[]) {
  return values
    .map((item) =>
      [
        item.organization,
        item.role,
        item.startDate ?? "",
        item.endDate ?? "",
        item.description,
      ].join(" | "),
    )
    .join("\n");
}

function parseExperienceText(value: string): ResumeExperience[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [organization = "", role = "", startDate = "", endDate = "", ...rest] =
        line.split("|").map((item) => item.trim());

      return {
        organization,
        role,
        startDate: startDate || null,
        endDate: endDate || null,
        description: rest.join(" | "),
      };
    });
}

function serializeProjects(values: ResumeProject[]) {
  return values
    .map((item) =>
      [
        item.title,
        item.description,
        item.techStack.join(", "),
        item.linkUrl ?? "",
      ].join(" | "),
    )
    .join("\n");
}

function parseProjectsText(value: string): ResumeProject[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", description = "", techStack = "", linkUrl = ""] = line
        .split("|")
        .map((item) => item.trim());

      return {
        title,
        description,
        techStack: techStack.split(","),
        linkUrl: linkUrl || null,
      };
    });
}

function serializeLinks(values: ExternalLink[]) {
  return values
    .map((item) => [item.label, item.type, item.url].join(" | "))
    .join("\n");
}

function parseLinksText(value: string): ExternalLink[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", type = "other", url = ""] = line
        .split("|")
        .map((item) => item.trim());
      const resolvedType = externalLinkTypeValues.includes(type as ExternalLinkType)
        ? (type as ExternalLinkType)
        : "other";

      return {
        label,
        type: resolvedType,
        url,
      };
    });
}

function buildDraftFromResume(resume: Resume): ResumeDraft {
  return {
    title: resume.title,
    summary: resume.summary,
    skillsText: resume.skills.join(", "),
    education: resume.education,
    experienceText: serializeExperience(resume.experience),
    projectsText: serializeProjects(resume.projects),
    linksText: serializeLinks(resume.links),
    visibility: resume.visibility,
  };
}

function buildPayloadFromDraft(draft: ResumeDraft): UpdateResumeRequest {
  return {
    title: normalizeText(draft.title),
    summary: normalizeText(draft.summary),
    skills: normalizeStringList(draft.skillsText.split(",")),
    education: normalizeText(draft.education),
    experience: normalizeResumeExperience(parseExperienceText(draft.experienceText)),
    projects: normalizeResumeProjects(parseProjectsText(draft.projectsText)),
    links: normalizeExternalLinks(parseLinksText(draft.linksText)),
    visibility: draft.visibility,
  };
}

function buildPreviewResume(base: Resume, draft: ResumeDraft): Resume {
  const payload = buildPayloadFromDraft(draft);

  return {
    ...base,
    title: payload.title ?? base.title,
    summary: payload.summary ?? base.summary,
    skills: payload.skills ?? base.skills,
    education: payload.education ?? base.education,
    experience: payload.experience ?? base.experience,
    projects: payload.projects ?? base.projects,
    links: payload.links ?? base.links,
    visibility: payload.visibility ?? base.visibility,
  };
}

function formatResumeTimestamp(value: string) {
  return dateFormatter.format(new Date(value));
}

function getVisibilityLabel(value: ResumeVisibility) {
  return value === "shared" ? "공개" : "비공개";
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
              로그인하고 이력서 열기
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
              AI Handoff
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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredDraft = useDeferredValue(draft);
  const previewResume = buildPreviewResume(savedResume, deferredDraft);
  const previewCompleteness = buildResumeCompleteness(previewResume);
  const savedSnapshot = JSON.stringify(
    buildPayloadFromDraft(buildDraftFromResume(savedResume)),
  );
  const draftSnapshot = JSON.stringify(buildPayloadFromDraft(draft));
  const isDirty = savedSnapshot !== draftSnapshot;

  const mergeProfileLinks = () => {
    const nextLinks = normalizeExternalLinks([
      ...parseLinksText(draft.linksText),
      ...model.profile.links,
    ]);

    setDraft((current) => ({
      ...current,
      linksText: serializeLinks(nextLinks),
    }));
    setNotice("프로필 링크를 이력서 링크 편집기에 가져왔습니다.");
    setError("");
  };

  const applyProfileHeadline = () => {
    if (!model.profile.headline.trim()) {
      setNotice("프로필 헤드라인이 아직 없어 바로 가져올 초안이 없습니다.");
      setError("");
      return;
    }

    setDraft((current) => ({
      ...current,
      summary: current.summary.trim()
        ? `${model.profile.headline}\n\n${current.summary}`
        : model.profile.headline,
    }));
    setNotice("프로필 헤드라인을 이력서 요약 초안으로 가져왔습니다.");
    setError("");
  };

  const handleSave = () => {
    setError("");
    setNotice("");

    startTransition(async () => {
      const response = await fetch("/api/resume", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayloadFromDraft(draft)),
      });

      const result = (await response.json()) as
        | ApiSuccess<ResumePayload>
        | ApiError;

      if (!response.ok || !result.success) {
        setError(
          "error" in result ? result.error.message : "이력서 저장에 실패했습니다.",
        );
        return;
      }

      setSavedResume(result.data.resume);
      setSavedCompleteness(result.data.completeness);
      setDraft(buildDraftFromResume(result.data.resume));
      setNotice("이력서를 저장했습니다. completeness와 draft가 다시 동기화되었습니다.");
    });
  };

  const parsedLinks = parseLinksText(draft.linksText);
  const parsedExperience = parseExperienceText(draft.experienceText);
  const parsedProjects = parseProjectsText(draft.projectsText);

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
              disabled={isPending}
              className="button-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "저장 중..." : isDirty ? "변경사항 저장" : "저장 완료"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Preview Score", `${previewCompleteness.score}%`],
            ["Saved Score", `${savedCompleteness.score}%`],
            ["Visibility", getVisibilityLabel(previewResume.visibility)],
            ["Profile Link", model.profile.headline.trim() ? "연결됨" : "헤드라인 필요"],
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

            {error ? (
              <div className="mt-4 rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="mt-4 rounded-[1.25rem] bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                {notice}
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Profile Context
            </p>
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
              AI Replacement Points
            </p>
            <div className="mt-4 grid gap-3">
              {model.replacementPoints.map((point) => (
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
        </div>
      </section>
    </div>
  );
}
