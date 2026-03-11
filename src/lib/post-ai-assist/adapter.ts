import type {
  AiSuggestion,
  AiSuggestionResult,
  RecruitPostAiDraft,
  RecruitPostAiSuggestionRequest,
  RecruitPostAiSuggestionTarget,
} from "@/types/ai";
import type { RecruitCategory } from "@/types/recruit";
import {
  postAiAssistReplacementPoints,
  type PostAiAssistReplacementPoint,
} from "@/lib/post-ai-assist/integration-points";

export type BranchLocalPostAssistDraft = {
  category: RecruitCategory;
  campus: string;
  title: string;
  summary: string;
  description: string;
  roles: string[];
  techStack: string[];
  capacity: number;
  stage: string;
  deadline: string;
  ownerRole: string;
  meetingStyle: string;
  schedule: string;
  goal: string;
};

export type PostAiAssistTarget = "title" | "summary" | "description";

export type PostAiAssistOption = {
  id: string;
  target: PostAiAssistTarget;
  label: string;
  text: string;
  rationale: string;
  confidence: AiSuggestion["confidence"];
  action: AiSuggestion["action"];
};

export type PostAiAssistSuggestions = {
  generatedAt: string | null;
  summaryNote: string;
  title: PostAiAssistOption[];
  summary: PostAiAssistOption[];
  description: PostAiAssistOption[];
};

export type PostAiAssistViewModel = {
  readiness: "seeded" | "needs_context";
  badge: string;
  title: string;
  subtitle: string;
  contextCards: Array<{ label: string; value: string }>;
  notes: string[];
  replacementPoints: PostAiAssistReplacementPoint[];
};

const categoryLabel: Record<RecruitCategory, string> = {
  study: "스터디",
  project: "프로젝트",
  hackathon: "해커톤",
};

function compactText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function listText(values: string[], emptyLabel: string) {
  return values.length > 0 ? values.join(", ") : emptyLabel;
}

function getSuggestionTarget(target: PostAiAssistTarget): RecruitPostAiSuggestionTarget {
  switch (target) {
    case "title":
      return "recruit_title";
    case "summary":
      return "recruit_summary";
    case "description":
    default:
      return "recruit_description";
  }
}

function getTargetSourceText(
  draft: BranchLocalPostAssistDraft,
  target: PostAiAssistTarget,
) {
  switch (target) {
    case "title":
      return compactText(draft.title) || null;
    case "summary":
      return compactText(draft.summary) || null;
    case "description":
    default:
      return compactText(draft.description) || null;
  }
}

function getTargetInstruction(target: PostAiAssistTarget) {
  switch (target) {
    case "title":
      return "워크숍 데모용 모집글에 맞게 짧고 명확한 제목을 제안해줘.";
    case "summary":
      return "목록 카드에서 바로 이해되는 한 줄 요약을 제안해줘.";
    case "description":
    default:
      return "지원자가 역할, 목표, 진행 방식을 빠르게 이해할 수 있는 상세 설명을 제안해줘.";
  }
}

export function toRecruitPostAiDraft(
  draft: BranchLocalPostAssistDraft,
): RecruitPostAiDraft {
  return {
    category: draft.category,
    campus: compactText(draft.campus),
    title: compactText(draft.title),
    summary: compactText(draft.summary),
    description: compactText(draft.description),
    roles: draft.roles.map((item) => compactText(item)).filter(Boolean),
    techStack: draft.techStack.map((item) => compactText(item)).filter(Boolean),
    capacity: Number.isFinite(draft.capacity) && draft.capacity > 0 ? draft.capacity : null,
    stage: compactText(draft.stage),
    deadline: compactText(draft.deadline) || null,
    ownerRole: compactText(draft.ownerRole),
    meetingStyle: compactText(draft.meetingStyle),
    schedule: compactText(draft.schedule),
    goal: compactText(draft.goal),
  };
}

export function buildRecruitPostSuggestionRequest(input: {
  draft: BranchLocalPostAssistDraft;
  target: PostAiAssistTarget;
  locale?: string | null;
}): RecruitPostAiSuggestionRequest {
  return {
    feature: "recruit_post",
    target: getSuggestionTarget(input.target),
    instruction: getTargetInstruction(input.target),
    locale: input.locale ?? "ko-KR",
    sourceText: getTargetSourceText(input.draft, input.target),
    draft: toRecruitPostAiDraft(input.draft),
  };
}

export function buildPostAiAssistViewModel(
  draft: BranchLocalPostAssistDraft,
): PostAiAssistViewModel {
  const seededFields = [
    compactText(draft.goal),
    draft.roles[0] ?? "",
    draft.techStack[0] ?? "",
    compactText(draft.schedule),
  ].filter(Boolean).length;

  return {
    readiness: seededFields >= 2 ? "seeded" : "needs_context",
    badge: "Shared AI Assist",
    title: "모집글 AI 초안 보조",
    subtitle:
      seededFields >= 2
        ? "Phase 3 suggestion job API를 통해 제목, 카드 요약, 상세 설명 초안을 생성합니다."
        : "역할, 목표, 일정 중 2개 이상이 채워지면 더 설득력 있는 추천을 만들 수 있습니다.",
    contextCards: [
      { label: "모집 유형", value: categoryLabel[draft.category] },
      { label: "모집 역할", value: listText(draft.roles, "입력 대기") },
      { label: "기술 스택", value: listText(draft.techStack, "입력 대기") },
      { label: "팀 목표", value: compactText(draft.goal) || "입력 대기" },
    ],
    notes: [
      "AI suggestion 생성은 /api/ai/suggestions/jobs shared contract를 그대로 사용합니다.",
      "추천 적용은 기존 글쓰기 draft만 갱신하고 /api/posts 요청 shape는 변경하지 않습니다.",
      "모집글 생성 흐름과 AI suggestion 흐름은 분리되어 있어, 추천 없이도 기존 글쓰기 submit은 그대로 동작합니다.",
    ],
    replacementPoints: postAiAssistReplacementPoints,
  };
}

function mapSuggestionTarget(target: AiSuggestion["target"]): PostAiAssistTarget | null {
  switch (target) {
    case "recruit_title":
      return "title";
    case "recruit_summary":
      return "summary";
    case "recruit_description":
      return "description";
    default:
      return null;
  }
}

function toPostAiAssistOption(
  suggestion: AiSuggestion,
): PostAiAssistOption | null {
  const target = mapSuggestionTarget(suggestion.target);

  if (!target || suggestion.valueType !== "text") {
    return null;
  }

  return {
    id: suggestion.id,
    target,
    label: suggestion.label,
    text: suggestion.value,
    rationale: suggestion.rationale,
    confidence: suggestion.confidence,
    action: suggestion.action,
  };
}

export function emptyPostAiAssistSuggestions(): PostAiAssistSuggestions {
  return {
    generatedAt: null,
    summaryNote: "",
    title: [],
    summary: [],
    description: [],
  };
}

export function mapSuggestionResultsToPostAssistSuggestions(
  results: AiSuggestionResult[],
): PostAiAssistSuggestions {
  const initial = emptyPostAiAssistSuggestions();

  return results.reduce<PostAiAssistSuggestions>((current, result) => {
    const mapped = result.suggestions
      .map((suggestion) => toPostAiAssistOption(suggestion))
      .filter((item): item is PostAiAssistOption => item !== null);

    const generatedAt =
      !current.generatedAt || current.generatedAt < result.generatedAt
        ? result.generatedAt
        : current.generatedAt;
    const summaryNote = [current.summaryNote, result.summaryNote]
      .filter(Boolean)
      .join(" ");

    if (result.target === "recruit_title") {
      return { ...current, generatedAt, summaryNote, title: mapped };
    }

    if (result.target === "recruit_summary") {
      return { ...current, generatedAt, summaryNote, summary: mapped };
    }

    if (result.target === "recruit_description") {
      return { ...current, generatedAt, summaryNote, description: mapped };
    }

    return current;
  }, initial);
}
