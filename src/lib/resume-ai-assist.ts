import { normalizeText } from "@/lib/identity";
import {
  normalizeExternalLinks,
  normalizeResumeExperience,
  normalizeResumeProjects,
  normalizeStringList,
} from "@/lib/profile";
import type { OnboardingState } from "@/types/identity";
import type {
  AiSuggestion,
  ResumeAiSuggestionRequest,
  ResumeAiSuggestionTarget,
} from "@/types/ai";
import type {
  ExternalLink,
  ExternalLinkType,
  Profile,
  Resume,
  ResumeExperience,
  ResumeProject,
  ResumeVisibility,
  UpdateResumeRequest,
} from "@/types/profile";
import { externalLinkTypeValues } from "@/types/profile";

export type ResumeDraft = {
  title: string;
  summary: string;
  skillsText: string;
  education: string;
  experienceText: string;
  projectsText: string;
  linksText: string;
  visibility: ResumeVisibility;
};

export type ResumeAiTargetOption = {
  target: ResumeAiSuggestionTarget;
  label: string;
  description: string;
  instructionPlaceholder: string;
};

export type ResumeAiRunContext = {
  request: ResumeAiSuggestionRequest;
  target: ResumeAiSuggestionTarget;
  experienceIndex: number | null;
  projectIndex: number | null;
  sourceLabel: string;
};

export type ResumeAiCurrentSource = {
  label: string;
  valueType: "text" | "string_list";
  text: string;
  list: string[];
};

export const resumeAiTargetOptions: ResumeAiTargetOption[] = [
  {
    target: "resume_summary",
    label: "요약 소개",
    description: "프로필 헤드라인과 협업 톤을 반영한 한 단락 소개를 만듭니다.",
    instructionPlaceholder: "예: 캠퍼스 프로젝트 협업 경험을 조금 더 자신감 있게 정리해줘.",
  },
  {
    target: "resume_skills",
    label: "핵심 스킬",
    description: "중복을 줄이고 발표나 지원에 바로 보이는 스킬 묶음을 정리합니다.",
    instructionPlaceholder: "예: 프론트엔드 중심으로 정리하되 팀 협업 역량도 함께 보여줘.",
  },
  {
    target: "resume_experience",
    label: "경험 설명",
    description: "선택한 경험 항목의 설명을 더 또렷한 bullet 문장으로 다듬습니다.",
    instructionPlaceholder: "예: 결과와 맡았던 역할이 먼저 보이게 다시 써줘.",
  },
  {
    target: "resume_project",
    label: "프로젝트 설명",
    description: "선택한 프로젝트 항목을 문제-행동-결과 흐름으로 다시 묶습니다.",
    instructionPlaceholder: "예: 기술 선택 이유와 발표 포인트가 같이 보이게 써줘.",
  },
  {
    target: "resume_full_review",
    label: "전체 리뷰",
    description: "현재 이력서 초안 전체를 읽고 우선 보강할 포인트를 제안합니다.",
    instructionPlaceholder: "예: 지금 상태에서 가장 먼저 손볼 우선순위를 짚어줘.",
  },
];

export function serializeExperience(values: ResumeExperience[]) {
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

export function parseExperienceText(value: string): ResumeExperience[] {
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

export function serializeProjects(values: ResumeProject[]) {
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

export function parseProjectsText(value: string): ResumeProject[] {
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

export function serializeLinks(values: ExternalLink[]) {
  return values
    .map((item) => [item.label, item.type, item.url].join(" | "))
    .join("\n");
}

export function parseLinksText(value: string): ExternalLink[] {
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

export function buildDraftFromResume(resume: Resume): ResumeDraft {
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

export function buildPayloadFromDraft(draft: ResumeDraft): UpdateResumeRequest {
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

export function buildPreviewResume(base: Resume, draft: ResumeDraft): Resume {
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

export function buildResumeAiRunContext(input: {
  target: ResumeAiSuggestionTarget;
  instruction: string;
  locale: string | null;
  resume: Resume;
  profile: Profile;
  onboarding: OnboardingState;
  parsedExperience: ResumeExperience[];
  parsedProjects: ResumeProject[];
  selectedExperienceIndex: number | null;
  selectedProjectIndex: number | null;
}):
  | { success: true; context: ResumeAiRunContext }
  | { success: false; message: string } {
  const instruction = normalizeOptionalText(input.instruction);
  const locale = normalizeOptionalText(input.locale);

  switch (input.target) {
    case "resume_experience": {
      const resolvedIndex = resolveSelectedIndex(
        input.parsedExperience.length,
        input.selectedExperienceIndex,
      );

      if (resolvedIndex === null) {
        return {
          success: false,
          message: "경험 설명을 다듬으려면 먼저 경험 항목을 한 개 이상 입력해주세요.",
        };
      }

      const selectedExperience = input.parsedExperience[resolvedIndex];

      return {
        success: true,
        context: {
          target: input.target,
          experienceIndex: resolvedIndex,
          projectIndex: null,
          sourceLabel: formatExperienceLabel(selectedExperience, resolvedIndex),
          request: {
            feature: "resume",
            target: input.target,
            instruction,
            locale,
            sourceText:
              normalizeText(selectedExperience.description) ||
              normalizeText(
                `${selectedExperience.organization} ${selectedExperience.role}`,
              ) ||
              null,
            resume: input.resume,
            profileSnapshot: buildProfileSnapshot(input.profile),
            onboardingKeywords: input.onboarding.interestKeywords,
          },
        },
      };
    }
    case "resume_project": {
      const resolvedIndex = resolveSelectedIndex(
        input.parsedProjects.length,
        input.selectedProjectIndex,
      );

      if (resolvedIndex === null) {
        return {
          success: false,
          message: "프로젝트 설명을 다듬으려면 먼저 프로젝트 항목을 한 개 이상 입력해주세요.",
        };
      }

      const selectedProject = input.parsedProjects[resolvedIndex];

      return {
        success: true,
        context: {
          target: input.target,
          experienceIndex: null,
          projectIndex: resolvedIndex,
          sourceLabel: formatProjectLabel(selectedProject, resolvedIndex),
          request: {
            feature: "resume",
            target: input.target,
            instruction,
            locale,
            sourceText:
              normalizeText(selectedProject.description) ||
              normalizeText(selectedProject.title) ||
              null,
            resume: input.resume,
            profileSnapshot: buildProfileSnapshot(input.profile),
            onboardingKeywords: input.onboarding.interestKeywords,
          },
        },
      };
    }
    case "resume_full_review":
      return {
        success: true,
        context: {
          target: input.target,
          experienceIndex: null,
          projectIndex: null,
          sourceLabel: "전체 이력서",
          request: {
            feature: "resume",
            target: input.target,
            instruction,
            locale,
            sourceText: buildFullReviewSourceText(
              input.resume,
              input.onboarding.interestKeywords,
            ),
            resume: input.resume,
            profileSnapshot: buildProfileSnapshot(input.profile),
            onboardingKeywords: input.onboarding.interestKeywords,
          },
        },
      };
    case "resume_skills":
      return {
        success: true,
        context: {
          target: input.target,
          experienceIndex: null,
          projectIndex: null,
          sourceLabel: "핵심 스킬",
          request: {
            feature: "resume",
            target: input.target,
            instruction,
            locale,
            sourceText:
              normalizeText(input.resume.skills.join(", ")) || normalizeText(input.resume.summary) || null,
            resume: input.resume,
            profileSnapshot: buildProfileSnapshot(input.profile),
            onboardingKeywords: input.onboarding.interestKeywords,
          },
        },
      };
    case "resume_summary":
    default:
      return {
        success: true,
        context: {
          target: "resume_summary",
          experienceIndex: null,
          projectIndex: null,
          sourceLabel: "요약 소개",
          request: {
            feature: "resume",
            target: "resume_summary",
            instruction,
            locale,
            sourceText:
              normalizeText(input.resume.summary) ||
              normalizeText(input.profile.headline) ||
              null,
            resume: input.resume,
            profileSnapshot: buildProfileSnapshot(input.profile),
            onboardingKeywords: input.onboarding.interestKeywords,
          },
        },
      };
  }
}

export function getResumeAiCurrentSource(input: {
  target: ResumeAiSuggestionTarget;
  draft: ResumeDraft;
  parsedExperience: ResumeExperience[];
  parsedProjects: ResumeProject[];
  selectedExperienceIndex: number | null;
  selectedProjectIndex: number | null;
}): ResumeAiCurrentSource {
  switch (input.target) {
    case "resume_skills":
      return {
        label: "핵심 스킬",
        valueType: "string_list",
        text: "",
        list: normalizeStringList(input.draft.skillsText.split(",")),
      };
    case "resume_experience": {
      const resolvedIndex = resolveSelectedIndex(
        input.parsedExperience.length,
        input.selectedExperienceIndex,
      );
      const selectedExperience =
        resolvedIndex === null ? null : input.parsedExperience[resolvedIndex];

      return {
        label:
          selectedExperience && resolvedIndex !== null
            ? formatExperienceLabel(selectedExperience, resolvedIndex)
            : "경험 항목",
        valueType: "text",
        text: normalizeText(selectedExperience?.description ?? ""),
        list: [],
      };
    }
    case "resume_project": {
      const resolvedIndex = resolveSelectedIndex(
        input.parsedProjects.length,
        input.selectedProjectIndex,
      );
      const selectedProject =
        resolvedIndex === null ? null : input.parsedProjects[resolvedIndex];

      return {
        label:
          selectedProject && resolvedIndex !== null
            ? formatProjectLabel(selectedProject, resolvedIndex)
            : "프로젝트 항목",
        valueType: "text",
        text: normalizeText(selectedProject?.description ?? ""),
        list: [],
      };
    }
    case "resume_full_review":
      return {
        label: "전체 이력서",
        valueType: "text",
        text: buildFullReviewDraftSnapshot(input.draft),
        list: [],
      };
    case "resume_summary":
    default:
      return {
        label: "요약 소개",
        valueType: "text",
        text: normalizeText(input.draft.summary),
        list: [],
      };
  }
}

export function applyAiSuggestionToDraft(input: {
  draft: ResumeDraft;
  parsedExperience: ResumeExperience[];
  parsedProjects: ResumeProject[];
  suggestion: AiSuggestion;
  runContext: ResumeAiRunContext | null;
}):
  | { success: true; draft: ResumeDraft; message: string }
  | { success: false; message: string } {
  const { draft, parsedExperience, parsedProjects, suggestion, runContext } = input;

  switch (suggestion.target) {
    case "resume_summary":
      if (suggestion.valueType !== "text") {
        return {
          success: false,
          message: "요약 소개 suggestion 형식을 해석하지 못했습니다.",
        };
      }

      return {
        success: true,
        draft: {
          ...draft,
          summary: applyTextSuggestion(draft.summary, suggestion),
        },
        message: "AI 요약 제안을 현재 초안에 반영했습니다. 저장 전에 미리보기를 확인해주세요.",
      };
    case "resume_skills": {
      const currentSkills = normalizeStringList(draft.skillsText.split(","));
      const nextSkills = applySkillSuggestion(currentSkills, suggestion);

      if (!nextSkills) {
        return {
          success: false,
          message: "스킬 suggestion 형식을 해석하지 못했습니다.",
        };
      }

      return {
        success: true,
        draft: {
          ...draft,
          skillsText: nextSkills.join(", "),
        },
        message: "AI 스킬 제안을 현재 초안에 반영했습니다. 저장 전에 순서를 한 번 더 확인해주세요.",
      };
    }
    case "resume_experience": {
      if (suggestion.valueType !== "text") {
        return {
          success: false,
          message: "경험 suggestion 형식을 해석하지 못했습니다.",
        };
      }

      const resolvedIndex = runContext?.experienceIndex ?? null;

      if (
        resolvedIndex === null ||
        resolvedIndex < 0 ||
        resolvedIndex >= parsedExperience.length
      ) {
        return {
          success: false,
          message: "적용할 경험 항목을 찾지 못했습니다. 항목을 다시 선택한 뒤 제안을 다시 생성해주세요.",
        };
      }

      const nextExperience = [...parsedExperience];
      nextExperience[resolvedIndex] = {
        ...nextExperience[resolvedIndex],
        description: applyTextSuggestion(
          nextExperience[resolvedIndex].description,
          suggestion,
        ),
      };

      return {
        success: true,
        draft: {
          ...draft,
          experienceText: serializeExperience(
            normalizeResumeExperience(nextExperience),
          ),
        },
        message: `${runContext?.sourceLabel ?? "경험 항목"} 제안을 초안에 반영했습니다. 저장 전에 항목 문장을 확인해주세요.`,
      };
    }
    case "resume_project": {
      if (suggestion.valueType !== "text") {
        return {
          success: false,
          message: "프로젝트 suggestion 형식을 해석하지 못했습니다.",
        };
      }

      const resolvedIndex = runContext?.projectIndex ?? null;

      if (
        resolvedIndex === null ||
        resolvedIndex < 0 ||
        resolvedIndex >= parsedProjects.length
      ) {
        return {
          success: false,
          message: "적용할 프로젝트 항목을 찾지 못했습니다. 항목을 다시 선택한 뒤 제안을 다시 생성해주세요.",
        };
      }

      const nextProjects = [...parsedProjects];
      nextProjects[resolvedIndex] = {
        ...nextProjects[resolvedIndex],
        description: applyTextSuggestion(
          nextProjects[resolvedIndex].description,
          suggestion,
        ),
      };

      return {
        success: true,
        draft: {
          ...draft,
          projectsText: serializeProjects(normalizeResumeProjects(nextProjects)),
        },
        message: `${runContext?.sourceLabel ?? "프로젝트 항목"} 제안을 초안에 반영했습니다. 저장 전에 설명과 기술 맥락을 함께 확인해주세요.`,
      };
    }
    case "resume_full_review":
      return {
        success: false,
        message: "전체 리뷰 suggestion은 검토용입니다. 내용을 보고 직접 초안을 수정해주세요.",
      };
    default:
      return {
        success: false,
        message: "아직 연결되지 않은 suggestion target입니다.",
      };
  }
}

export function resolveSelectedIndex(length: number, index: number | null) {
  if (length === 0) {
    return null;
  }

  if (typeof index !== "number" || Number.isNaN(index)) {
    return 0;
  }

  return Math.min(length - 1, Math.max(0, index));
}

export function formatExperienceLabel(
  item: ResumeExperience,
  index: number,
) {
  return (
    normalizeText(`${item.organization} · ${item.role}`) ||
    normalizeText(item.organization) ||
    normalizeText(item.role) ||
    `경험 ${index + 1}`
  );
}

export function formatProjectLabel(item: ResumeProject, index: number) {
  return normalizeText(item.title) || `프로젝트 ${index + 1}`;
}

function applyTextSuggestion(current: string, suggestion: Extract<AiSuggestion, { valueType: "text" }>) {
  const nextValue = normalizeText(suggestion.value);

  if (!nextValue) {
    return normalizeText(current);
  }

  if (suggestion.action === "append" && normalizeText(current)) {
    return `${normalizeText(current)}\n${nextValue}`;
  }

  return nextValue;
}

function applySkillSuggestion(currentSkills: string[], suggestion: AiSuggestion) {
  const listValue =
    suggestion.valueType === "string_list"
      ? normalizeStringList(suggestion.value)
      : normalizeStringList(suggestion.value.split(","));

  if (suggestion.action === "replace") {
    return listValue;
  }

  return normalizeStringList([...currentSkills, ...listValue]);
}

function buildProfileSnapshot(profile: Profile) {
  return {
    headline: profile.headline,
    intro: profile.intro,
    openToRoles: profile.openToRoles,
    links: profile.links,
  };
}

function buildFullReviewSourceText(resume: Resume, onboardingKeywords: string[]) {
  const summary = normalizeText(resume.summary) || "미입력";
  const skills =
    resume.skills.length > 0 ? resume.skills.join(", ") : "미입력";
  const experienceCount = resume.experience.length;
  const projectCount = resume.projects.length;
  const keywords =
    onboardingKeywords.length > 0 ? onboardingKeywords.join(", ") : "미입력";

  return [
    `Summary: ${summary}`,
    `Skills: ${skills}`,
    `Education: ${normalizeText(resume.education) || "미입력"}`,
    `Experience Count: ${experienceCount}`,
    `Project Count: ${projectCount}`,
    `Links Count: ${resume.links.length}`,
    `Onboarding Keywords: ${keywords}`,
  ].join("\n");
}

function buildFullReviewDraftSnapshot(draft: ResumeDraft) {
  const skillCount = normalizeStringList(draft.skillsText.split(",")).length;
  const experienceCount = parseExperienceText(draft.experienceText).length;
  const projectCount = parseProjectsText(draft.projectsText).length;
  const linkCount = parseLinksText(draft.linksText).length;

  return [
    `요약 소개: ${normalizeText(draft.summary) || "미입력"}`,
    `핵심 스킬 수: ${skillCount}`,
    `경험 항목 수: ${experienceCount}`,
    `프로젝트 항목 수: ${projectCount}`,
    `링크 수: ${linkCount}`,
  ].join("\n");
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = normalizeText(value ?? "");
  return normalized || null;
}
