import { buildGitHubProfileUrl, normalizeGitHubUsername } from "@/lib/ai-platform";
import { normalizeText } from "@/lib/identity";
import {
  githubAnalysisAdminIntegrationPoints,
  githubAnalysisProfileIntegrationPoints,
} from "@/lib/github-analysis/integration-points";
import type {
  GithubAnalysisProfileContext,
  GithubAnalysisSnapshot,
  GithubAnalysisViewModel,
  GithubConnectionDraft,
  GithubProjectInsight,
} from "@/lib/github-analysis/types";
import { findGithubProfileLink } from "@/lib/github-analysis/types";
import type {
  AiPlatformProviderCatalog,
  CreateGitHubAnalysisJobRequest,
  GitHubAnalysisJob,
  GitHubConnection,
} from "@/types/ai";
import type { AuthContext } from "@/types/identity";

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => normalizeText(value ?? "")).filter(Boolean)),
  );
}

function buildInitialDraft(input: {
  profileContext: GithubAnalysisProfileContext;
  connection: GitHubConnection | null;
}): GithubConnectionDraft {
  if (
    input.connection?.status === "connected" &&
    input.connection.username &&
    input.connection.profileUrl
  ) {
    return {
      username: input.connection.username,
      profileUrl: input.connection.profileUrl,
    };
  }

  const githubLink = findGithubProfileLink(input.profileContext.profile.links);

  if (!githubLink) {
    return {
      username: "",
      profileUrl: "",
    };
  }

  return {
    username: normalizeGitHubUsername(githubLink.url),
    profileUrl: githubLink.url,
  };
}

function buildDefaultAnalysisRequest(
  authContext: Extract<AuthContext, { authenticated: true }>,
): CreateGitHubAnalysisJobRequest {
  return {
    focus: authContext.user.role === "admin" ? "team_fit" : "portfolio_overview",
    maxRepositories: 3,
    preferredLanguages: [],
  };
}

function buildGuestSummaryCards() {
  return [
    { label: "연결 상태", value: "로그인 필요" },
    { label: "분석 방식", value: "GitHub job polling" },
    { label: "후속 연동", value: "Profile + Resume + Admin" },
  ];
}

function buildReadySummaryCards(input: {
  authContext: Extract<AuthContext, { authenticated: true }>;
  connection: GitHubConnection | null;
  dataSourceLabel: string;
}) {
  const connectedLabel =
    input.connection?.status === "connected" && input.connection.username
      ? `@${input.connection.username}`
      : "연결 필요";
  const latestRunLabel = input.connection?.lastAnalysisJobId
    ? "최근 분석 있음"
    : "분석 전";

  return [
    { label: "세션 역할", value: input.authContext.user.role },
    { label: "GitHub 연결", value: connectedLabel },
    { label: "최근 실행", value: latestRunLabel },
    { label: "Data Source", value: input.dataSourceLabel },
  ];
}

function formatRepositoryActivity(value: string | null) {
  if (!value) {
    return "업데이트 이력 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getRepositoryHealth(
  stars: number,
  index: number,
): GithubProjectInsight["health"] {
  if (stars >= 12 || index === 0) {
    return "strong";
  }

  if (stars >= 5 || index === 1) {
    return "promising";
  }

  return "watch";
}

function buildProjectInsights(job: GitHubAnalysisJob): GithubProjectInsight[] {
  if (job.status !== "succeeded" || !job.result) {
    return [];
  }

  return job.result.repositories.map((repository, index) => {
    const highlights = uniqueStrings([
      repository.primaryLanguage,
      repository.topics[0],
      repository.topics[1],
      job.result?.strengths[index] ?? job.result?.strengths[0],
    ]);
    const signals = uniqueStrings([
      `추천 역할: ${repository.roleHint}`,
      `최근 업데이트: ${formatRepositoryActivity(repository.lastUpdatedAt)}`,
      repository.description,
    ]);

    return {
      id: repository.repoUrl,
      name: repository.name,
      repoUrl: repository.repoUrl,
      summary: repository.description,
      roleFit: repository.roleHint
        ? `${repository.roleHint} 역할 힌트가 분명한 저장소`
        : "역할 힌트가 아직 분명하지 않은 저장소",
      activity: `${repository.stars} stars · ${formatRepositoryActivity(
        repository.lastUpdatedAt,
      )}`,
      health: getRepositoryHealth(repository.stars, index),
      highlights,
      signals,
      techStack: uniqueStrings([
        repository.primaryLanguage,
        ...repository.topics,
      ]),
    };
  });
}

function buildCollaborationFit(context: GithubAnalysisProfileContext) {
  switch (context.profile.collaborationStyle) {
    case "async_first":
      return "문서 기반 비동기 협업에 적합";
    case "live_sprint":
      return "짧은 스프린트와 빠른 피드백 루프에 적합";
    case "hybrid":
      return "오프라인/온라인 혼합 협업에 적합";
    default:
      return "작은 팀의 빠른 반복 작업에 적합";
  }
}

export function buildGithubAnalysisSnapshot(input: {
  job: GitHubAnalysisJob | null;
  context: GithubAnalysisProfileContext | null;
}): GithubAnalysisSnapshot | null {
  if (!input.context || !input.job || input.job.status !== "succeeded" || !input.job.result) {
    return null;
  }

  const topLanguages = input.job.result.topLanguages.map((item) => item.name);

  return {
    generatedAt: input.job.result.analyzedAt,
    coverageLabel: `${input.job.result.repositories.length} repositories analyzed`,
    standoutStack:
      topLanguages.length > 0 ? topLanguages.slice(0, 2).join(" + ") : "TypeScript",
    collaborationFit: buildCollaborationFit(input.context),
    confidenceLabel: `Provider ${input.job.provider}`,
    summary: input.job.result.summary,
    strengths: input.job.result.strengths,
    focusAreas: uniqueStrings([
      input.job.request.focus,
      ...input.job.result.recommendedRoles,
    ]).slice(0, 4),
    recommendedRoles: uniqueStrings(input.job.result.recommendedRoles),
    projects: buildProjectInsights(input.job),
  };
}

export function buildGithubAnalysisViewModel(input: {
  authContext: AuthContext;
  profileContext?: GithubAnalysisProfileContext | null;
  connection?: GitHubConnection | null;
  providers?: AiPlatformProviderCatalog | null;
}): GithubAnalysisViewModel {
  const {
    authContext,
    profileContext = null,
    connection = null,
    providers = null,
  } = input;

  if (!authContext.authenticated || !profileContext) {
    return {
      status: "guest",
      role: "guest",
      badge: "GitHub Analysis",
      title: "GitHub 등록과 프로젝트 분석",
      subtitle:
        "로그인 후 shared Phase 3 API로 GitHub 연결 상태를 저장하고, 분석 job 결과를 polling으로 확인할 수 있습니다.",
      dataSourceLabel: "Auth required",
      summaryCards: buildGuestSummaryCards(),
      notes: [
        "GitHub 연결은 /api/github/connection shared contract를 source of truth로 사용합니다.",
        "분석 결과는 /api/github/analysis/jobs polling 흐름으로 가져옵니다.",
      ],
      integrationPoints: {
        profile: githubAnalysisProfileIntegrationPoints,
        admin: githubAnalysisAdminIntegrationPoints,
      },
      initialDraft: {
        username: "",
        profileUrl: "",
      },
      initialConnection: null,
      initialAnalysisJobId: null,
      defaultAnalysisRequest: {
        focus: "portfolio_overview",
        maxRepositories: 3,
        preferredLanguages: [],
      },
      providers,
      profileContext: null,
    };
  }

  return {
    status: "ready",
    role: authContext.user.role,
    badge:
      authContext.user.role === "admin" ? "AI Operations Preview" : "GitHub Connection",
    title:
      authContext.user.role === "admin"
        ? "GitHub 분석 재사용 포인트"
        : "GitHub 등록과 프로젝트 분석",
    subtitle:
      authContext.user.role === "admin"
        ? "관리자 세션에서도 shared GitHub connection과 analysis job 상태를 같은 계약으로 읽어 재사용 포인트를 검토할 수 있습니다."
        : "프로필 링크와 세션 정보를 바탕으로 GitHub 연결을 저장하고, latest analysis job 결과를 바로 확인할 수 있습니다.",
    dataSourceLabel: profileContext.dataSource,
    summaryCards: buildReadySummaryCards({
      authContext,
      connection,
      dataSourceLabel: profileContext.dataSource,
    }),
    notes: [
      "GitHub 연결 저장/해제는 /api/github/connection shared contract를 그대로 사용합니다.",
      "분석 실행과 상태 조회는 /api/github/analysis/jobs polling 흐름을 따릅니다.",
      authContext.user.role === "admin"
        ? "관리자 세션에서는 운영 재사용 포인트를 함께 보여주지만, 별도 운영 액션은 추가하지 않습니다."
        : "학생 세션에서는 연결 저장, 분석 재실행, latest result 확인 UX를 제공합니다.",
    ],
    integrationPoints: {
      profile: githubAnalysisProfileIntegrationPoints,
      admin: githubAnalysisAdminIntegrationPoints,
    },
    initialDraft: buildInitialDraft({
      profileContext,
      connection,
    }),
    initialConnection: connection,
    initialAnalysisJobId: connection?.lastAnalysisJobId ?? null,
    defaultAnalysisRequest: buildDefaultAnalysisRequest(authContext),
    providers,
    profileContext,
  };
}

export function getConnectedProfileUrl(connection: GitHubConnection | null) {
  if (
    connection?.status === "connected" &&
    connection.username &&
    connection.profileUrl
  ) {
    return connection.profileUrl;
  }

  if (connection?.status === "connected" && connection.username) {
    return buildGitHubProfileUrl(connection.username);
  }

  return null;
}
