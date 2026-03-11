import { normalizeText } from "@/lib/identity";
import { isValidHttpUrl } from "@/lib/profile";
import {
  githubAnalysisAdminIntegrationPoints,
  githubAnalysisProfileIntegrationPoints,
} from "@/lib/github-analysis/integration-points";
import type {
  GithubAnalysisProfileContext,
  GithubAnalysisSnapshot,
  GithubAnalysisViewModel,
  GithubConnectionDraft,
  GithubConnectionRecord,
  GithubProjectInsight,
} from "@/lib/github-analysis/types";
import { findGithubProfileLink } from "@/lib/github-analysis/types";
import type { AuthContext } from "@/types/identity";

function parseGithubUsername(value: string) {
  const normalized = normalizeText(value)
    .replace(/^@+/, "")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\/+$/, "")
    .split("/")[0];

  if (!normalized) {
    return "";
  }

  return normalized.replace(/[^a-zA-Z0-9-]/g, "");
}

function buildProjectInsights(
  username: string,
  context: GithubAnalysisProfileContext,
): GithubProjectInsight[] {
  const primaryRole = context.profile.openToRoles[0] ?? "frontend";
  const secondaryRole = context.profile.openToRoles[1] ?? "product";
  const keywordPool = [
    ...context.onboarding.interestKeywords,
    ...context.profile.openToRoles,
  ].filter(Boolean);
  const focusKeyword = keywordPool[0] ?? "collaboration";
  const secondaryKeyword = keywordPool[1] ?? "delivery";

  return [
    {
      id: "analysis-campus-link",
      name: "campus-link-workshop",
      repoUrl: `https://github.com/${username}/campus-link-workshop`,
      summary:
        "지원 흐름과 프로필 모듈을 분리해 데모 범위 안에서도 기능 경계를 명확히 유지한 프로젝트로 해석됩니다.",
      roleFit: `${primaryRole} 중심 협업에서 바로 활용 가능한 구조`,
      activity: "최근 브랜치 단위 작업과 화면 연결 지점이 꾸준히 갱신됨",
      health: "strong",
      highlights: [
        "문서 우선 구조와 기능 모듈 경계가 안정적입니다.",
        "profile, resume, verification 계약을 재사용하는 흐름이 자연스럽습니다.",
      ],
      signals: [
        `${focusKeyword} 관련 맥락을 UI와 데이터 설명에 함께 반영합니다.`,
        "작은 브랜치 단위로 기능을 쪼개는 협업 패턴이 보입니다.",
      ],
      techStack: ["Next.js", "TypeScript", "Tailwind CSS"],
    },
    {
      id: "analysis-team-signal",
      name: `${username}-team-sync`,
      repoUrl: `https://github.com/${username}/${username}-team-sync`,
      summary:
        "기술 구현보다 팀 운영 신호와 문서 정리에 강점이 있는 저장소로 분류되는 canned insight입니다.",
      roleFit: `${secondaryRole} 또는 coordination 역할과 잘 맞는 프로젝트 흔적`,
      activity: "협업 메모와 구조 정리가 강점으로 보이는 패턴",
      health: "promising",
      highlights: [
        "요구사항을 화면보다 먼저 구조화하는 성향을 확인했습니다.",
        "동료가 재사용할 수 있는 handoff 문구를 남기는 편입니다.",
      ],
      signals: [
        `${secondaryKeyword} 관점의 의사결정 근거가 눈에 띕니다.`,
        "후속 브랜치가 끼워 넣기 쉬운 설명 단위를 유지합니다.",
      ],
      techStack: ["Markdown", "Next.js", "Prisma"],
    },
    {
      id: "analysis-experiment",
      name: `${username}-prototype-lab`,
      repoUrl: `https://github.com/${username}/${username}-prototype-lab`,
      summary:
        "실험성 높은 아이디어를 빠르게 검증한 뒤 핵심만 남기는 타입의 작업 로그를 가정한 canned insight입니다.",
      roleFit: "아이디어 검증 또는 0→1 프로토타이핑 역할에 적합",
      activity: "짧은 사이클의 시도와 정리 메모가 반복되는 흐름",
      health: "watch",
      highlights: [
        "프로토타입 속도는 좋지만 결과 정리 기준을 더 명확히 하면 좋습니다.",
      ],
      signals: [
        "실험 결과를 resume 또는 모집글 맥락으로 재해석할 여지가 큽니다.",
      ],
      techStack: ["React", "Node.js", "OpenAI-ready"],
    },
  ];
}

export function buildBranchLocalConnection(input: {
  draft: GithubConnectionDraft;
  existingConnectedAt?: string | null;
  repositoryCount?: number;
}): GithubConnectionRecord {
  const username = parseGithubUsername(input.draft.username || input.draft.profileUrl);
  const profileUrl = isValidHttpUrl(input.draft.profileUrl)
    ? normalizeText(input.draft.profileUrl)
    : `https://github.com/${username}`;
  const now = new Date().toISOString();

  return {
    username,
    profileUrl,
    source: "branch_local_demo",
    status: "connected",
    repositoryCount: input.repositoryCount ?? 3,
    connectedAt: input.existingConnectedAt ?? now,
    lastSyncedAt: now,
  };
}

export function buildBranchLocalAnalysis(input: {
  connection: GithubConnectionRecord;
  context: GithubAnalysisProfileContext;
}): GithubAnalysisSnapshot {
  const projects = buildProjectInsights(input.connection.username, input.context);
  const spotlightStack = projects[0]?.techStack[0] ?? "TypeScript";

  return {
    state: "ready",
    generatedAt: new Date().toISOString(),
    coverageLabel: `${projects.length} demo repositories mapped`,
    standoutStack: `${spotlightStack} + ${
      projects[0]?.techStack[1] ?? "UI architecture"
    }`,
    collaborationFit:
      input.context.profile.collaborationStyle === "async_first"
        ? "문서 기반 비동기 협업에 강함"
        : "작은 팀에서 빠른 반복 작업에 적합",
    confidenceLabel: "Branch-local canned result",
    focusAreas: [
      ...new Set([
        ...input.context.profile.openToRoles,
        ...input.context.onboarding.interestKeywords.slice(0, 3),
      ]),
    ].slice(0, 4),
    notes: [
      "이 결과는 feature/p3-ai-platform-contracts 머지 전까지 branch-local adapter가 생성하는 canned analysis입니다.",
      "provider 응답 키와 job state shape는 이 브랜치에서 확정하지 않고, UI는 요약 카드와 프로젝트 인사이트 슬롯만 먼저 고정합니다.",
      "profile, resume, admin surface는 동일한 요약 블록을 재사용할 수 있도록 분리된 integration points를 참조합니다.",
    ],
    projects: [...projects],
  };
}

export function buildGithubAnalysisViewModel(input: {
  authContext: AuthContext;
  profileContext?: GithubAnalysisProfileContext | null;
}): GithubAnalysisViewModel {
  const { authContext, profileContext = null } = input;

  if (!authContext.authenticated || !profileContext) {
    return {
      status: "guest",
      role: "guest",
      badge: "GitHub Analysis Preview",
      title: "GitHub 등록과 프로젝트 분석 미리보기",
      subtitle:
        "Phase 3 계약이 합쳐지기 전까지는 branch-local adapter 뒤에서 등록 흐름과 analysis result UI 슬롯만 먼저 고정합니다.",
      dataSourceLabel: "Auth required",
      summaryCards: [
        { label: "연결 상태", value: "로그인 필요" },
        { label: "결과 형태", value: "canned analysis UI" },
        { label: "후속 연동", value: "Profile + Admin" },
      ],
      notes: [
        "게스트 화면은 등록 폼과 결과 레이아웃만 미리 보여줍니다.",
        "공통 provider 응답이나 최종 analysis payload shape는 이 브랜치에서 정의하지 않습니다.",
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
      initialAnalysis: null,
      profileContext: null,
    };
  }

  const githubLink = findGithubProfileLink(profileContext.profile.links);
  const seededUsername = githubLink
    ? parseGithubUsername(githubLink.url)
    : parseGithubUsername(profileContext.user.displayName);
  const initialDraft = {
    username: seededUsername,
    profileUrl: githubLink?.url ?? (seededUsername ? `https://github.com/${seededUsername}` : ""),
  };
  const initialConnection = githubLink
    ? {
        username: seededUsername,
        profileUrl: githubLink.url,
        source: "profile_link" as const,
        status: "connected" as const,
        repositoryCount: 3,
        connectedAt: profileContext.profile.updatedAt,
        lastSyncedAt: profileContext.profile.updatedAt,
      }
    : null;
  const initialAnalysis = initialConnection
    ? buildBranchLocalAnalysis({
        connection: initialConnection,
        context: profileContext,
      })
    : null;

  return {
    status: "ready",
    role: authContext.user.role,
    badge:
      authContext.user.role === "admin"
        ? "AI Operations Preview"
        : "GitHub Connection",
    title:
      authContext.user.role === "admin"
        ? "GitHub 분석 재사용 포인트"
        : "GitHub 등록과 프로젝트 분석",
    subtitle:
      authContext.user.role === "admin"
        ? "관리자 세션에서는 학생용 연결/분석 결과가 어떤 요약 블록으로 재사용될지와 연결 포인트를 먼저 확인합니다."
        : "프로필 링크와 관심 역할을 바탕으로 GitHub 연결 상태를 관리하고, branch-local canned analysis 결과를 미리 확인할 수 있습니다.",
    dataSourceLabel: profileContext.dataSource,
    summaryCards: [
      { label: "세션 역할", value: authContext.user.role },
      {
        label: "GitHub 링크",
        value: githubLink ? "프로필 링크 감지됨" : "직접 등록 필요",
      },
      {
        label: "상태 경계",
        value: "branch-local adapter",
      },
    ],
    notes: [
      "현재 화면은 shared Phase 3 contract 없이도 연결 상태와 결과 레이아웃을 검증하기 위한 임시 adapter를 사용합니다.",
      "실제 provider 호출, job polling, payload parsing은 feature/p3-ai-platform-contracts 이후 교체 지점으로만 남깁니다.",
      authContext.user.role === "admin"
        ? "관리자 세션에서는 운영 재사용 포인트를 함께 보여주지만, 별도 운영 액션은 추가하지 않습니다."
        : "학생 세션에서는 등록, 재분석, 연결 해제 UX만 먼저 제공합니다.",
    ],
    integrationPoints: {
      profile: githubAnalysisProfileIntegrationPoints,
      admin: githubAnalysisAdminIntegrationPoints,
    },
    initialDraft,
    initialConnection,
    initialAnalysis,
    profileContext,
  };
}
