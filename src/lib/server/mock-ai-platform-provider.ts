import { buildGitHubProfileUrl } from "@/lib/ai-platform";
import { normalizeText } from "@/lib/identity";
import { normalizeStringList } from "@/lib/profile";
import type {
  AiSuggestion,
  AiSuggestionResult,
  CreateAiSuggestionJobRequest,
  CreateGitHubAnalysisJobRequest,
  GitHubAnalysisResult,
  GitHubConnection,
} from "@/types/ai";

type GitHubAnalysisProviderInput = {
  connection: GitHubConnection;
  request: CreateGitHubAnalysisJobRequest;
};

type AiSuggestionProviderInput = {
  request: CreateAiSuggestionJobRequest;
};

const defaultLanguages = ["TypeScript", "JavaScript", "Python"];

export async function createMockGitHubAnalysisResult(
  input: GitHubAnalysisProviderInput,
): Promise<GitHubAnalysisResult> {
  const username = input.connection.username ?? "campus-link-demo";
  const profileUrl = input.connection.profileUrl ?? buildGitHubProfileUrl(username);
  const topLanguages = buildLanguageShares(input.request.preferredLanguages);
  const recommendedRoles = getRecommendedRoles(input.request.focus);
  const repositories = Array.from(
    { length: input.request.maxRepositories },
    (_, index) => buildRepositoryInsight(username, topLanguages, recommendedRoles, index),
  );
  const summary = buildGitHubSummary(username, input.request.focus, topLanguages);

  return {
    username,
    profileUrl,
    analyzedAt: new Date().toISOString(),
    focus: input.request.focus,
    summary,
    strengths: [
      `${topLanguages[0]?.name ?? "TypeScript"} 중심의 작업 흔적이 뚜렷합니다.`,
      "짧은 스프린트 데모에 맞는 레포 분리가 잘 드러납니다.",
      "협업형 프로젝트 설명과 역할 힌트가 UI/문서 중심 포지션에 잘 맞습니다.",
    ],
    recommendedRoles,
    topLanguages,
    repositories,
  };
}

export async function createMockAiSuggestionResult(
  input: AiSuggestionProviderInput,
): Promise<AiSuggestionResult> {
  const suggestions =
    input.request.feature === "resume"
      ? buildResumeSuggestions(input.request)
      : buildRecruitSuggestions(input.request);

  return {
    feature: input.request.feature,
    target: input.request.target,
    generatedAt: new Date().toISOString(),
    summaryNote: `${suggestions.length}개의 제안을 현재 초안 기준으로 생성했습니다.`,
    suggestions,
  };
}

function buildLanguageShares(preferredLanguages: string[]) {
  const languages = normalizeStringList(preferredLanguages).slice(0, 3);
  const resolved = languages.length > 0 ? languages : defaultLanguages;
  const weights = [48, 32, 20];

  return resolved.map((name, index) => ({
    name,
    share: weights[index] ?? 10,
  }));
}

function getRecommendedRoles(focus: CreateGitHubAnalysisJobRequest["focus"]) {
  switch (focus) {
    case "team_fit":
      return ["frontend", "product", "fullstack"];
    case "resume_enrichment":
      return ["frontend", "technical_writer", "fullstack"];
    default:
      return ["frontend", "prototype_builder", "product"];
  }
}

function buildRepositoryInsight(
  username: string,
  languages: GitHubAnalysisResult["topLanguages"],
  roles: string[],
  index: number,
) {
  const language = languages[index % languages.length]?.name ?? defaultLanguages[0];

  return {
    name: `${username}-project-${index + 1}`,
    description:
      index === 0
        ? "캠퍼스 데모 흐름과 협업 문서를 함께 다루는 대표 레포지토리"
        : `주력 언어 ${language} 중심으로 정리된 실험/프로토타입 레포지토리`,
    repoUrl: `https://github.com/${username}/${username}-project-${index + 1}`,
    primaryLanguage: language,
    stars: 12 + index * 7,
    topics: normalizeStringList([
      language.toLowerCase(),
      "campus-link",
      index % 2 === 0 ? "prototype" : "documentation",
    ]),
    roleHint: roles[index % roles.length],
    lastUpdatedAt: new Date(Date.now() - index * 86400000).toISOString(),
  };
}

function buildGitHubSummary(
  username: string,
  focus: CreateGitHubAnalysisJobRequest["focus"],
  topLanguages: GitHubAnalysisResult["topLanguages"],
) {
  const topLanguage = topLanguages[0]?.name ?? defaultLanguages[0];

  switch (focus) {
    case "team_fit":
      return `${username}는 ${topLanguage} 기반 프론트엔드/프로토타입 작업에 강하고, 짧은 기간 팀 프로젝트에 바로 투입하기 좋은 GitHub 패턴을 보입니다.`;
    case "resume_enrichment":
      return `${username}의 저장소는 ${topLanguage} 중심 프로젝트 설명, 역할 단서, 최근 활동 흔적이 있어 이력서 bullet과 프로젝트 소개 문장을 보강하기에 적합합니다.`;
    default:
      return `${username}의 GitHub는 ${topLanguage} 중심 포트폴리오와 데모 성격 레포가 분명해 Phase 3 분석 카드의 기본 스토리라인으로 쓰기 좋습니다.`;
  }
}

function buildResumeSuggestions(
  request: Extract<CreateAiSuggestionJobRequest, { feature: "resume" }>,
) {
  const baseSource =
    normalizeText(request.sourceText ?? request.resume.summary) ||
    request.profileSnapshot.headline ||
    request.resume.title;
  const keywords = request.onboardingKeywords.slice(0, 3);

  switch (request.target) {
    case "resume_skills":
      return [
        createListSuggestion({
          id: "resume-skills-core",
          target: request.target,
          label: "핵심 스킬 정리안",
          rationale: "현재 resume, 프로필 역할 선호, 온보딩 키워드를 합쳐 중복 없이 정리했습니다.",
          value: normalizeStringList([
            ...request.resume.skills,
            ...request.profileSnapshot.openToRoles,
            ...keywords,
          ]),
          confidence: "high",
        }),
        createListSuggestion({
          id: "resume-skills-demo",
          target: request.target,
          label: "데모 중심 스킬 세트",
          rationale: "워크숍 데모 발표에 바로 보이는 키워드 위주로 재정렬했습니다.",
          value: normalizeStringList([
            ...request.resume.skills,
            "UI Prototyping",
            "Cross-functional Communication",
          ]),
          confidence: "medium",
        }),
      ];
    case "resume_experience":
      return [
        createTextSuggestion({
          id: "resume-experience-impact",
          target: request.target,
          label: "성과 강조형 문장",
          rationale: "경험 설명에 결과와 역할 범위를 더 선명하게 보이도록 정리했습니다.",
          value: `${baseSource}. 특히 데모 일정 안에서 화면 구현, API 연결, 문서 handoff까지 책임진 점을 강조하면 좋습니다.`,
          confidence: "high",
        }),
        createTextSuggestion({
          id: "resume-experience-collaboration",
          target: request.target,
          label: "협업 강조형 문장",
          rationale: "팀 협업 맥락과 커뮤니케이션 장점을 더 잘 보이도록 다듬었습니다.",
          value: `${baseSource}. 비동기 문서화와 빠른 피드백 루프를 유지하며 팀 생산성을 높였다는 점을 함께 적어보세요.`,
          confidence: "medium",
        }),
      ];
    case "resume_project":
      return [
        createTextSuggestion({
          id: "resume-project-story",
          target: request.target,
          label: "프로젝트 스토리 초안",
          rationale: "프로젝트 설명을 문제-행동-결과 순서로 다시 묶었습니다.",
          value: `${baseSource}. 사용자 흐름을 끊기지 않게 설계하고, 데모에서 바로 설명 가능한 구조로 정리한 점을 한 문단으로 보여주면 좋습니다.`,
          confidence: "high",
        }),
        createTextSuggestion({
          id: "resume-project-stack",
          target: request.target,
          label: "기술 선택 설명 초안",
          rationale: "기술 스택을 단순 나열 대신 선택 이유와 연결하도록 제안합니다.",
          value: `${baseSource}. Next.js와 TypeScript를 사용해 빠른 반복과 안정적인 계약 관리가 가능했다는 점을 함께 적어보세요.`,
          confidence: "medium",
        }),
      ];
    case "resume_full_review":
      return [
        createTextSuggestion({
          id: "resume-review-summary",
          target: request.target,
          label: "전체 리뷰 요약",
          rationale: "현재 이력서에서 가장 먼저 보강하면 좋은 부분을 한 문장으로 묶었습니다.",
          value: "요약 소개는 이미 방향성이 좋고, 다음 단계는 경험 bullet에 구체적인 결과 수치나 산출물을 더하는 것입니다.",
          confidence: "high",
        }),
        createTextSuggestion({
          id: "resume-review-next-step",
          target: request.target,
          label: "다음 수정 우선순위",
          rationale: "다운스트림 UI가 바로 CTA나 checklist로 연결할 수 있게 작성했습니다.",
          value: "프로젝트 설명, 핵심 스킬 그룹화, GitHub 분석에서 얻은 역할 힌트를 순서대로 반영하면 completeness와 설득력이 같이 올라갑니다.",
          confidence: "medium",
        }),
      ];
    case "resume_summary":
    default:
      return [
        createTextSuggestion({
          id: "resume-summary-profile",
          target: request.target,
          label: "프로필 연동형 요약",
          rationale: "프로필 헤드라인과 온보딩 키워드를 요약 소개에 직접 반영했습니다.",
          value: `${request.profileSnapshot.headline || request.resume.title}. ${keywords.length > 0 ? `${keywords.join(", ")} 주제에 강한 ` : ""}캠퍼스 프로젝트에서 빠르게 MVP를 정리하고 문서화하는 협업자입니다.`,
          confidence: "high",
        }),
        createTextSuggestion({
          id: "resume-summary-impact",
          target: request.target,
          label: "기여 강조형 요약",
          rationale: "현재 초안의 톤을 유지하면서 실질적인 기여 포인트가 먼저 보이도록 바꿨습니다.",
          value: `${baseSource}. 요구사항 정리부터 UI 구현, 발표용 polish까지 이어지는 end-to-end 기여를 강점으로 드러내 보세요.`,
          confidence: "medium",
        }),
      ];
  }
}

function buildRecruitSuggestions(
  request: Extract<CreateAiSuggestionJobRequest, { feature: "recruit_post" }>,
) {
  const roles = request.draft.roles.slice(0, 3);
  const baseTitle = request.draft.title || `${request.draft.category ?? "project"} 팀원 모집`;
  const baseSummary =
    normalizeText(request.sourceText ?? request.draft.summary) || request.draft.goal;

  switch (request.target) {
    case "recruit_description":
      return [
        createTextSuggestion({
          id: "recruit-description-story",
          target: request.target,
          label: "설명 본문 초안",
          rationale: "목표, 역할, 진행 방식을 한 흐름으로 이어 발표용 설명력을 높였습니다.",
          value: `${request.draft.goal || "짧은 기간 안에 데모를 완성하는"} 프로젝트입니다. ${roles.length > 0 ? `${roles.join(", ")} 역할을 중심으로` : "함께 실행할 팀원을"} 찾고 있으며, ${request.draft.meetingStyle || "유연한 협업 방식"}으로 빠르게 의사결정하려고 합니다.`,
          confidence: "high",
        }),
        createTextSuggestion({
          id: "recruit-description-cta",
          target: request.target,
          label: "지원 유도형 본문",
          rationale: "후반 문장에 기대 역할과 합류 후 첫 액션을 더 분명히 넣었습니다.",
          value: `${baseSummary || baseTitle}. 합류 직후에는 요구사항 정리와 첫 화면/기능 분담부터 바로 시작할 예정이라, 짧은 스프린트에 익숙한 분이면 특히 잘 맞습니다.`,
          confidence: "medium",
        }),
      ];
    case "recruit_summary":
      return [
        createTextSuggestion({
          id: "recruit-summary-goal",
          target: request.target,
          label: "목표 강조형 요약",
          rationale: "목표와 일정 감각이 카드에서 바로 보이도록 정리했습니다.",
          value: `${request.draft.goal || "배포 가능한 데모 완성"}를 목표로 하는 ${request.draft.category ?? "project"} 팀입니다. ${roles.length > 0 ? `${roles.join(", ")} 포지션을 우선 모집합니다.` : "실행형 팀원을 찾고 있습니다."}`,
          confidence: "high",
        }),
        createTextSuggestion({
          id: "recruit-summary-tone",
          target: request.target,
          label: "협업 톤 강조형 요약",
          rationale: "팀 분위기와 진행 방식을 카드 문장 안에 같이 담았습니다.",
          value: `${baseSummary || baseTitle}. ${request.draft.meetingStyle || "하이브리드"} 방식으로 짧고 밀도 있게 협업할 팀원을 찾습니다.`,
          confidence: "medium",
        }),
      ];
    case "recruit_title":
    default:
      return [
        createTextSuggestion({
          id: "recruit-title-role",
          target: request.target,
          label: "역할 중심 제목",
          rationale: "모집 포지션과 목표가 제목만으로 보이게 만들었습니다.",
          value: `${roles[0] ?? "Frontend"} 중심 ${request.draft.category ?? "project"} 데모 팀원 모집`,
          confidence: "high",
        }),
        createTextSuggestion({
          id: "recruit-title-goal",
          target: request.target,
          label: "결과물 중심 제목",
          rationale: "발표/배포 같은 결과물을 전면에 둔 버전입니다.",
          value: `${request.draft.goal || "배포 가능한 MVP"}를 함께 만들 ${request.draft.category ?? "project"} 팀원 모집`,
          confidence: "medium",
        }),
      ];
  }
}

function createTextSuggestion(input: {
  id: string;
  target: AiSuggestion["target"];
  label: string;
  rationale: string;
  value: string;
  confidence: AiSuggestion["confidence"];
}) {
  return {
    id: input.id,
    target: input.target,
    label: input.label,
    rationale: input.rationale,
    action: "replace" as const,
    confidence: input.confidence,
    valueType: "text" as const,
    value: normalizeText(input.value),
  };
}

function createListSuggestion(input: {
  id: string;
  target: AiSuggestion["target"];
  label: string;
  rationale: string;
  value: string[];
  confidence: AiSuggestion["confidence"];
}) {
  return {
    id: input.id,
    target: input.target,
    label: input.label,
    rationale: input.rationale,
    action: "merge_list" as const,
    confidence: input.confidence,
    valueType: "string_list" as const,
    value: normalizeStringList(input.value),
  };
}
