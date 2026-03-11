import type { IdentityDataSource } from "@/types/identity";
import type { Profile, Resume } from "@/types/profile";
import type { RecruitCategory } from "@/types/recruit";

export const githubConnectionStatusValues = [
  "not_connected",
  "connected",
  "error",
] as const;

export type GitHubConnectionStatus =
  (typeof githubConnectionStatusValues)[number];

export const githubConnectionProviderValues = [
  "mock_github",
  "github_oauth",
] as const;

export type GitHubConnectionProvider =
  (typeof githubConnectionProviderValues)[number];

export const githubAnalysisProviderValues = [
  "mock_analysis",
  "openai",
] as const;

export type GitHubAnalysisProvider =
  (typeof githubAnalysisProviderValues)[number];

export const aiSuggestionProviderValues = [
  "mock_suggestions",
  "openai",
] as const;

export type AiSuggestionProvider =
  (typeof aiSuggestionProviderValues)[number];

export type AiPlatformProviderCatalog = {
  githubConnection: {
    provider: GitHubConnectionProvider;
    label: string;
  };
  githubAnalysis: {
    provider: GitHubAnalysisProvider;
    label: string;
  };
  aiSuggestion: {
    provider: AiSuggestionProvider;
    label: string;
  };
};

export type GitHubConnection = {
  userId: string;
  username: string | null;
  profileUrl: string | null;
  provider: GitHubConnectionProvider;
  status: GitHubConnectionStatus;
  connectedAt: string | null;
  lastValidatedAt: string | null;
  lastAnalysisJobId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGitHubConnectionRequest = {
  username: string;
  profileUrl?: string | null;
};

export const githubAnalysisFocusValues = [
  "portfolio_overview",
  "team_fit",
  "resume_enrichment",
] as const;

export type GitHubAnalysisFocus = (typeof githubAnalysisFocusValues)[number];

export type CreateGitHubAnalysisJobRequest = {
  focus: GitHubAnalysisFocus;
  maxRepositories: number;
  preferredLanguages: string[];
};

export type CreateGitHubAnalysisJobInput =
  Partial<CreateGitHubAnalysisJobRequest>;

export type GitHubLanguageShare = {
  name: string;
  share: number;
};

export type GitHubRepositoryInsight = {
  name: string;
  description: string;
  repoUrl: string;
  primaryLanguage: string | null;
  stars: number;
  topics: string[];
  roleHint: string;
  lastUpdatedAt: string | null;
};

export type GitHubAnalysisResult = {
  username: string;
  profileUrl: string;
  analyzedAt: string;
  focus: GitHubAnalysisFocus;
  summary: string;
  strengths: string[];
  recommendedRoles: string[];
  topLanguages: GitHubLanguageShare[];
  repositories: GitHubRepositoryInsight[];
};

export const resumeSuggestionTargetValues = [
  "resume_summary",
  "resume_skills",
  "resume_experience",
  "resume_project",
  "resume_full_review",
] as const;

export type ResumeAiSuggestionTarget =
  (typeof resumeSuggestionTargetValues)[number];

export const recruitSuggestionTargetValues = [
  "recruit_title",
  "recruit_summary",
  "recruit_description",
] as const;

export type RecruitPostAiSuggestionTarget =
  (typeof recruitSuggestionTargetValues)[number];

export const aiSuggestionTargetValues = [
  ...resumeSuggestionTargetValues,
  ...recruitSuggestionTargetValues,
] as const;

export type AiSuggestionTarget = (typeof aiSuggestionTargetValues)[number];

export type AiSuggestionFeature = "resume" | "recruit_post";

export const aiSuggestionActionValues = [
  "replace",
  "append",
  "merge_list",
] as const;

export type AiSuggestionAction = (typeof aiSuggestionActionValues)[number];

export const aiSuggestionConfidenceValues = [
  "high",
  "medium",
  "low",
] as const;

export type AiSuggestionConfidence =
  (typeof aiSuggestionConfidenceValues)[number];

export type ResumeProfileSnapshot = Pick<
  Profile,
  "headline" | "intro" | "openToRoles" | "links"
>;

export type RecruitPostAiDraft = {
  category: RecruitCategory | null;
  campus: string;
  title: string;
  summary: string;
  description: string;
  roles: string[];
  techStack: string[];
  capacity: number | null;
  stage: string;
  deadline: string | null;
  ownerRole: string;
  meetingStyle: string;
  schedule: string;
  goal: string;
};

export type ResumeAiSuggestionRequest = {
  feature: "resume";
  target: ResumeAiSuggestionTarget;
  instruction: string | null;
  locale: string | null;
  sourceText: string | null;
  resume: Resume;
  profileSnapshot: ResumeProfileSnapshot;
  onboardingKeywords: string[];
};

export type RecruitPostAiSuggestionRequest = {
  feature: "recruit_post";
  target: RecruitPostAiSuggestionTarget;
  instruction: string | null;
  locale: string | null;
  sourceText: string | null;
  draft: RecruitPostAiDraft;
};

export type CreateAiSuggestionJobRequest =
  | ResumeAiSuggestionRequest
  | RecruitPostAiSuggestionRequest;

type BaseAiSuggestion = {
  id: string;
  target: AiSuggestionTarget;
  label: string;
  rationale: string;
  action: AiSuggestionAction;
  confidence: AiSuggestionConfidence;
};

export type TextAiSuggestion = BaseAiSuggestion & {
  valueType: "text";
  value: string;
};

export type StringListAiSuggestion = BaseAiSuggestion & {
  valueType: "string_list";
  value: string[];
};

export type AiSuggestion = TextAiSuggestion | StringListAiSuggestion;

export type AiSuggestionResult = {
  feature: AiSuggestionFeature;
  target: AiSuggestionTarget;
  generatedAt: string;
  summaryNote: string;
  suggestions: AiSuggestion[];
};

export const aiJobKindValues = [
  "github_analysis",
  "ai_suggestion",
] as const;

export type AiJobKind = (typeof aiJobKindValues)[number];

export const aiJobStatusValues = [
  "queued",
  "running",
  "succeeded",
  "failed",
] as const;

export type AiJobStatus = (typeof aiJobStatusValues)[number];

export const aiJobErrorCodeValues = [
  "PROVIDER_UNAVAILABLE",
  "GITHUB_CONNECTION_REQUIRED",
  "UPSTREAM_FAILED",
] as const;

export type AiJobErrorCode = (typeof aiJobErrorCodeValues)[number];

export type AiJobError = {
  code: AiJobErrorCode;
  message: string;
  retryable: boolean;
};

export type AiJob<Request, Result, Provider extends string> = {
  id: string;
  userId: string;
  kind: AiJobKind;
  status: AiJobStatus;
  provider: Provider;
  request: Request;
  result: Result | null;
  error: AiJobError | null;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type GitHubAnalysisJob = AiJob<
  CreateGitHubAnalysisJobRequest,
  GitHubAnalysisResult,
  GitHubAnalysisProvider
>;

export type AiSuggestionJob = AiJob<
  CreateAiSuggestionJobRequest,
  AiSuggestionResult,
  AiSuggestionProvider
>;

export type GitHubConnectionPayload = {
  connection: GitHubConnection;
  providers: AiPlatformProviderCatalog;
  dataSource: IdentityDataSource;
};

export type GitHubAnalysisJobPayload = {
  job: GitHubAnalysisJob;
  providers: AiPlatformProviderCatalog;
  dataSource: IdentityDataSource;
};

export type AiSuggestionJobPayload = {
  job: AiSuggestionJob;
  providers: AiPlatformProviderCatalog;
  dataSource: IdentityDataSource;
};

export type AiPlatformErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "GITHUB_CONNECTION_REQUIRED"
  | "JOB_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE";
