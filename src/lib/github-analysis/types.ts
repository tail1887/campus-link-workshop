import type {
  AiPlatformProviderCatalog,
  CreateGitHubAnalysisJobRequest,
  GitHubConnection,
} from "@/types/ai";
import type { IdentityDataSource, OnboardingState, User } from "@/types/identity";
import type { ExternalLink, Profile } from "@/types/profile";

export type GithubConnectionDraft = {
  username: string;
  profileUrl: string;
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
  generatedAt: string;
  coverageLabel: string;
  standoutStack: string;
  collaborationFit: string;
  confidenceLabel: string;
  summary: string;
  strengths: string[];
  focusAreas: string[];
  recommendedRoles: string[];
  projects: GithubProjectInsight[];
};

export type GithubAnalysisProfileContext = {
  user: User;
  onboarding: OnboardingState;
  profile: Profile;
  dataSource: IdentityDataSource;
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
  initialConnection: GitHubConnection | null;
  initialAnalysisJobId: string | null;
  defaultAnalysisRequest: CreateGitHubAnalysisJobRequest;
  providers: AiPlatformProviderCatalog | null;
  profileContext: GithubAnalysisProfileContext | null;
};

export function findGithubProfileLink(links: ExternalLink[]) {
  return (
    links.find((link) => link.type === "github") ??
    links.find((link) => link.url.includes("github.com/")) ??
    null
  );
}
