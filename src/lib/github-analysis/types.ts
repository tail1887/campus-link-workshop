import type { IdentityDataSource, OnboardingState, User } from "@/types/identity";
import type { ExternalLink, Profile } from "@/types/profile";

export const githubConnectionStatusValues = [
  "not_connected",
  "connected",
  "syncing",
  "attention",
] as const;

export type GithubConnectionStatus =
  (typeof githubConnectionStatusValues)[number];

export const githubAnalysisStateValues = [
  "idle",
  "ready",
  "refreshing",
  "failed",
] as const;

export type GithubAnalysisState = (typeof githubAnalysisStateValues)[number];

export type GithubConnectionDraft = {
  username: string;
  profileUrl: string;
};

export type GithubConnectionRecord = {
  username: string;
  profileUrl: string;
  source: "profile_link" | "branch_local_demo";
  status: GithubConnectionStatus;
  repositoryCount: number;
  connectedAt: string;
  lastSyncedAt: string | null;
};

export type GithubProjectInsight = {
  id: string;
  name: string;
  repoUrl: string;
  summary: string;
  roleFit: string;
  activity: string;
  health: "strong" | "promising" | "watch";
  highlights: string[];
  signals: string[];
  techStack: string[];
};

export type GithubAnalysisSnapshot = {
  state: GithubAnalysisState;
  generatedAt: string | null;
  coverageLabel: string;
  standoutStack: string;
  collaborationFit: string;
  confidenceLabel: string;
  focusAreas: string[];
  notes: string[];
  projects: GithubProjectInsight[];
};

export type GithubAnalysisProfileContext = {
  user: User;
  onboarding: OnboardingState;
  profile: Profile;
  dataSource: IdentityDataSource;
};

export type GithubAnalysisStorageRecord = {
  connection: GithubConnectionRecord | null;
  analysis: GithubAnalysisSnapshot | null;
};

export type GithubAnalysisViewModel = {
  status: "guest" | "ready";
  role: User["role"] | "guest";
  badge: string;
  title: string;
  subtitle: string;
  dataSourceLabel: string;
  summaryCards: Array<{ label: string; value: string }>;
  notes: string[];
  integrationPoints: {
    profile: Array<{ id: string; title: string; description: string; replaceWhen: string }>;
    admin: Array<{ id: string; title: string; description: string; replaceWhen: string }>;
  };
  initialDraft: GithubConnectionDraft;
  initialConnection: GithubConnectionRecord | null;
  initialAnalysis: GithubAnalysisSnapshot | null;
  profileContext: GithubAnalysisProfileContext | null;
};

export function findGithubProfileLink(links: ExternalLink[]) {
  return (
    links.find((link) => link.type === "github") ??
    links.find((link) => link.url.includes("github.com/")) ??
    null
  );
}
