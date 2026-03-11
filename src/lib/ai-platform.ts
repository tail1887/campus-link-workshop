import {
  normalizeOptionalText,
  normalizeText,
} from "@/lib/identity";
import {
  isExternalLink,
  isPlainObject,
  isResumeExperience,
  isResumeProject,
  isResumeVisibility,
  isValidHttpUrl,
  normalizeExternalLinks,
  normalizeResumeExperience,
  normalizeResumeProjects,
  normalizeStringList,
} from "@/lib/profile";
import type {
  AiJobError,
  AiJobErrorCode,
  AiSuggestionProvider,
  CreateAiSuggestionJobRequest,
  CreateGitHubAnalysisJobInput,
  CreateGitHubAnalysisJobRequest,
  GitHubAnalysisFocus,
  GitHubAnalysisProvider,
  GitHubConnection,
  GitHubConnectionProvider,
  RecruitPostAiDraft,
  ResumeAiSuggestionRequest,
  ResumeAiSuggestionTarget,
  ResumeProfileSnapshot,
  UpdateGitHubConnectionRequest,
  RecruitPostAiSuggestionRequest,
  RecruitPostAiSuggestionTarget,
} from "@/types/ai";
import {
  aiJobErrorCodeValues,
  aiSuggestionProviderValues,
  githubAnalysisFocusValues,
  githubAnalysisProviderValues,
  githubConnectionProviderValues,
  recruitSuggestionTargetValues,
  resumeSuggestionTargetValues,
} from "@/types/ai";
import type { Resume } from "@/types/profile";
import type { RecruitCategory } from "@/types/recruit";

const githubUsernamePattern = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/;
const recruitCategoryValues: RecruitCategory[] = [
  "study",
  "project",
  "hackathon",
];

export function isGitHubConnectionProvider(
  value: unknown,
): value is GitHubConnectionProvider {
  return (
    typeof value === "string" &&
    githubConnectionProviderValues.includes(value as GitHubConnectionProvider)
  );
}

export function isGitHubAnalysisProvider(
  value: unknown,
): value is GitHubAnalysisProvider {
  return (
    typeof value === "string" &&
    githubAnalysisProviderValues.includes(value as GitHubAnalysisProvider)
  );
}

export function isAiSuggestionProvider(
  value: unknown,
): value is AiSuggestionProvider {
  return (
    typeof value === "string" &&
    aiSuggestionProviderValues.includes(value as AiSuggestionProvider)
  );
}

export function isGitHubAnalysisFocus(
  value: unknown,
): value is GitHubAnalysisFocus {
  return (
    typeof value === "string" &&
    githubAnalysisFocusValues.includes(value as GitHubAnalysisFocus)
  );
}

export function isResumeAiSuggestionTarget(
  value: unknown,
): value is ResumeAiSuggestionTarget {
  return (
    typeof value === "string" &&
    resumeSuggestionTargetValues.includes(value as ResumeAiSuggestionTarget)
  );
}

export function isRecruitPostAiSuggestionTarget(
  value: unknown,
): value is RecruitPostAiSuggestionTarget {
  return (
    typeof value === "string" &&
    recruitSuggestionTargetValues.includes(
      value as RecruitPostAiSuggestionTarget,
    )
  );
}

export function isAiJobErrorCode(value: unknown): value is AiJobErrorCode {
  return (
    typeof value === "string" &&
    aiJobErrorCodeValues.includes(value as AiJobErrorCode)
  );
}

export function normalizeGitHubUsername(value: string) {
  const normalized = normalizeText(value)
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");

  return normalized.split(/[/?#]/)[0] ?? "";
}

export function isValidGitHubUsername(value: string) {
  return githubUsernamePattern.test(normalizeGitHubUsername(value));
}

export function buildGitHubProfileUrl(username: string) {
  return `https://github.com/${normalizeGitHubUsername(username)}`;
}

export function isGitHubProfileUrl(value: string) {
  if (!isValidHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return ["github.com", "www.github.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isUpdateGitHubConnectionRequest(
  value: unknown,
): value is UpdateGitHubConnectionRequest {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.username === "string" &&
    isValidGitHubUsername(value.username) &&
    (value.profileUrl === undefined ||
      value.profileUrl === null ||
      (typeof value.profileUrl === "string" &&
        isGitHubProfileUrl(value.profileUrl)))
  );
}

export function normalizeGitHubConnectionRequest(
  value: UpdateGitHubConnectionRequest,
) {
  const username = normalizeGitHubUsername(value.username);
  const profileUrl =
    normalizeOptionalText(value.profileUrl) ?? buildGitHubProfileUrl(username);

  return {
    username,
    profileUrl,
  };
}

export function buildDefaultGitHubConnection(
  userId: string,
  options?: Partial<GitHubConnection>,
): GitHubConnection {
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const updatedAt = options?.updatedAt ?? createdAt;

  return {
    userId,
    username: options?.username ?? null,
    profileUrl: options?.profileUrl ?? null,
    provider: options?.provider ?? "mock_github",
    status: options?.status ?? "not_connected",
    connectedAt: options?.connectedAt ?? null,
    lastValidatedAt: options?.lastValidatedAt ?? null,
    lastAnalysisJobId: options?.lastAnalysisJobId ?? null,
    createdAt,
    updatedAt,
  };
}

export function hasGitHubConnection(connection: GitHubConnection) {
  return connection.status === "connected" && Boolean(connection.username);
}

export function isGitHubAnalysisJobInput(
  value: unknown,
): value is CreateGitHubAnalysisJobInput {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    (value.focus === undefined || isGitHubAnalysisFocus(value.focus)) &&
    (value.maxRepositories === undefined ||
      (typeof value.maxRepositories === "number" &&
        Number.isInteger(value.maxRepositories) &&
        value.maxRepositories >= 1 &&
        value.maxRepositories <= 12)) &&
    (value.preferredLanguages === undefined ||
      (Array.isArray(value.preferredLanguages) &&
        value.preferredLanguages.every((item) => typeof item === "string")))
  );
}

export function normalizeGitHubAnalysisJobRequest(
  value: CreateGitHubAnalysisJobInput = {},
): CreateGitHubAnalysisJobRequest {
  return {
    focus:
      value.focus && isGitHubAnalysisFocus(value.focus)
        ? value.focus
        : "portfolio_overview",
    maxRepositories:
      typeof value.maxRepositories === "number" &&
      Number.isInteger(value.maxRepositories)
        ? Math.min(12, Math.max(1, value.maxRepositories))
        : 3,
    preferredLanguages: Array.isArray(value.preferredLanguages)
      ? normalizeStringList(value.preferredLanguages).slice(0, 8)
      : [],
  };
}

export function isResumeRecord(value: unknown): value is Resume {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.userId === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.skills) &&
    value.skills.every((item) => typeof item === "string") &&
    typeof value.education === "string" &&
    Array.isArray(value.experience) &&
    value.experience.every((item) => isResumeExperience(item)) &&
    Array.isArray(value.projects) &&
    value.projects.every((item) => isResumeProject(item)) &&
    Array.isArray(value.links) &&
    value.links.every((item) => isExternalLink(item)) &&
    isResumeVisibility(value.visibility) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function normalizeResumeRecord(value: Resume): Resume {
  return {
    userId: normalizeText(value.userId),
    title: normalizeText(value.title),
    summary: normalizeText(value.summary),
    skills: normalizeStringList(value.skills),
    education: normalizeText(value.education),
    experience: normalizeResumeExperience(value.experience),
    projects: normalizeResumeProjects(value.projects),
    links: normalizeExternalLinks(value.links),
    visibility: value.visibility,
    createdAt: normalizeText(value.createdAt),
    updatedAt: normalizeText(value.updatedAt),
  };
}

export function isResumeProfileSnapshot(
  value: unknown,
): value is ResumeProfileSnapshot {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.headline === "string" &&
    typeof value.intro === "string" &&
    Array.isArray(value.openToRoles) &&
    value.openToRoles.every((item) => typeof item === "string") &&
    Array.isArray(value.links) &&
    value.links.every((item) => isExternalLink(item))
  );
}

export function normalizeResumeProfileSnapshot(
  value: ResumeProfileSnapshot,
): ResumeProfileSnapshot {
  return {
    headline: normalizeText(value.headline),
    intro: normalizeText(value.intro),
    openToRoles: normalizeStringList(value.openToRoles),
    links: normalizeExternalLinks(value.links),
  };
}

export function isRecruitCategory(value: unknown): value is RecruitCategory {
  return (
    typeof value === "string" &&
    recruitCategoryValues.includes(value as RecruitCategory)
  );
}

export function isRecruitPostAiDraft(
  value: unknown,
): value is RecruitPostAiDraft {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    (value.category === null || isRecruitCategory(value.category)) &&
    typeof value.campus === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.roles) &&
    value.roles.every((item) => typeof item === "string") &&
    Array.isArray(value.techStack) &&
    value.techStack.every((item) => typeof item === "string") &&
    (value.capacity === null ||
      (typeof value.capacity === "number" && Number.isFinite(value.capacity))) &&
    typeof value.stage === "string" &&
    (value.deadline === null || typeof value.deadline === "string") &&
    typeof value.ownerRole === "string" &&
    typeof value.meetingStyle === "string" &&
    typeof value.schedule === "string" &&
    typeof value.goal === "string"
  );
}

export function normalizeRecruitPostAiDraft(
  value: RecruitPostAiDraft,
): RecruitPostAiDraft {
  return {
    category: value.category,
    campus: normalizeText(value.campus),
    title: normalizeText(value.title),
    summary: normalizeText(value.summary),
    description: normalizeText(value.description),
    roles: normalizeStringList(value.roles),
    techStack: normalizeStringList(value.techStack),
    capacity:
      typeof value.capacity === "number" && Number.isFinite(value.capacity)
        ? value.capacity
        : null,
    stage: normalizeText(value.stage),
    deadline: normalizeOptionalText(value.deadline),
    ownerRole: normalizeText(value.ownerRole),
    meetingStyle: normalizeText(value.meetingStyle),
    schedule: normalizeText(value.schedule),
    goal: normalizeText(value.goal),
  };
}

export function isResumeAiSuggestionRequest(
  value: unknown,
): value is ResumeAiSuggestionRequest {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    value.feature === "resume" &&
    isResumeAiSuggestionTarget(value.target) &&
    (value.instruction === null ||
      value.instruction === undefined ||
      typeof value.instruction === "string") &&
    (value.locale === null ||
      value.locale === undefined ||
      typeof value.locale === "string") &&
    (value.sourceText === null ||
      value.sourceText === undefined ||
      typeof value.sourceText === "string") &&
    isResumeRecord(value.resume) &&
    isResumeProfileSnapshot(value.profileSnapshot) &&
    Array.isArray(value.onboardingKeywords) &&
    value.onboardingKeywords.every((item) => typeof item === "string")
  );
}

export function isRecruitPostAiSuggestionRequest(
  value: unknown,
): value is RecruitPostAiSuggestionRequest {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    value.feature === "recruit_post" &&
    isRecruitPostAiSuggestionTarget(value.target) &&
    (value.instruction === null ||
      value.instruction === undefined ||
      typeof value.instruction === "string") &&
    (value.locale === null ||
      value.locale === undefined ||
      typeof value.locale === "string") &&
    (value.sourceText === null ||
      value.sourceText === undefined ||
      typeof value.sourceText === "string") &&
    isRecruitPostAiDraft(value.draft)
  );
}

export function isCreateAiSuggestionJobRequest(
  value: unknown,
): value is CreateAiSuggestionJobRequest {
  return (
    isResumeAiSuggestionRequest(value) ||
    isRecruitPostAiSuggestionRequest(value)
  );
}

export function normalizeCreateAiSuggestionJobRequest(
  value: CreateAiSuggestionJobRequest,
): CreateAiSuggestionJobRequest {
  if (value.feature === "resume") {
    return {
      feature: "resume",
      target: value.target,
      instruction: normalizeOptionalText(value.instruction),
      locale: normalizeOptionalText(value.locale),
      sourceText: normalizeOptionalText(value.sourceText),
      resume: normalizeResumeRecord(value.resume),
      profileSnapshot: normalizeResumeProfileSnapshot(value.profileSnapshot),
      onboardingKeywords: normalizeStringList(value.onboardingKeywords),
    };
  }

  return {
    feature: "recruit_post",
    target: value.target,
    instruction: normalizeOptionalText(value.instruction),
    locale: normalizeOptionalText(value.locale),
    sourceText: normalizeOptionalText(value.sourceText),
    draft: normalizeRecruitPostAiDraft(value.draft),
  };
}

export function buildAiJobError(
  code: AiJobErrorCode,
  message: string,
  retryable: boolean,
): AiJobError {
  return {
    code,
    message,
    retryable,
  };
}
