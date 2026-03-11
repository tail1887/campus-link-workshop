import type {
  CreateRecruitApplicationInput,
  CreateRecruitPostInput,
  RecruitApplication,
  RecruitCategory,
  RecruitPost,
} from "@/types/recruit";
import { normalizeText } from "@/lib/identity";

export const categoryMeta: Record<
  RecruitCategory,
  {
    label: string;
    description: string;
    surface: string;
    border: string;
    text: string;
  }
> = {
  study: {
    label: "스터디",
    description: "주제 학습과 발표 루틴을 함께 만드는 트랙",
    surface: "rgba(17, 140, 128, 0.12)",
    border: "rgba(17, 140, 128, 0.22)",
    text: "#0f7a70",
  },
  project: {
    label: "프로젝트",
    description: "배포와 결과물 제작까지 이어지는 빌드 트랙",
    surface: "rgba(255, 111, 60, 0.12)",
    border: "rgba(255, 111, 60, 0.24)",
    text: "#db5d2d",
  },
  hackathon: {
    label: "해커톤",
    description: "짧은 기간에 아이디어를 MVP로 바꾸는 스프린트 트랙",
    surface: "rgba(240, 173, 40, 0.14)",
    border: "rgba(240, 173, 40, 0.24)",
    text: "#b68016",
  },
};

export const categoryFilters: Array<{
  value: "all" | RecruitCategory;
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "study", label: "스터디" },
  { value: "project", label: "프로젝트" },
  { value: "hackathon", label: "해커톤" },
];

const MIN_RECRUIT_DEADLINE_YEAR = 2024;
const MAX_RECRUIT_DEADLINE_YEAR = 2100;
const HANGUL_JAMO_PATTERN = /[ㄱ-ㅎㅏ-ㅣ]{3,}/u;
const REPEATED_SEGMENT_PATTERN = /^(.{1,6})\1+$/u;

function normalizeRecruitToken(value: string) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeRecruitTextList(values: string[]) {
  return values.map(normalizeText).filter(Boolean);
}

function hasRepeatedSegmentText(value: string) {
  const compact = normalizeRecruitToken(value).replace(/\s+/g, "");

  return (
    compact.length >= 4 &&
    compact.length <= 24 &&
    REPEATED_SEGMENT_PATTERN.test(compact)
  );
}

function isBrokenRecruitField(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("�") ||
    /\?[\s?]*\?/.test(normalized) ||
    HANGUL_JAMO_PATTERN.test(normalized) ||
    hasRepeatedSegmentText(normalized)
  );
}

function hasRepeatedPlaceholderFields(post: RecruitPost) {
  const shortFields = [
    post.title,
    post.campus,
    post.stage,
    post.ownerName,
    post.ownerRole,
    post.meetingStyle,
  ]
    .map(normalizeRecruitToken)
    .filter((value) => value.length > 0 && value.length <= 8);

  const counts = new Map<string, number>();

  shortFields.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.values()].some((count) => count >= 3);
}

function buildRecruitPostFingerprint(post: RecruitPost) {
  return [
    post.category,
    normalizeRecruitToken(post.title),
    normalizeRecruitToken(post.campus),
    normalizeRecruitToken(post.summary),
    normalizeRecruitToken(post.description.split("\n")[0] ?? post.description),
    normalizeRecruitToken(post.ownerName),
    normalizeRecruitTextList(post.roles)
      .sort((left, right) => left.localeCompare(right))
      .join(","),
  ].join("|");
}

function sortRecruitPosts(posts: RecruitPost[]) {
  return [...posts].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function hasInvalidRecruitDeadline(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return true;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  const year = date.getUTCFullYear();
  return year < MIN_RECRUIT_DEADLINE_YEAR || year > MAX_RECRUIT_DEADLINE_YEAR;
}

export function curateRecruitPosts(posts: RecruitPost[]) {
  const seenSlugs = new Set<string>();
  const seenFingerprints = new Set<string>();
  const curated: RecruitPost[] = [];

  sortRecruitPosts(posts).forEach((post) => {
    if (seenSlugs.has(post.slug) || isBrokenRecruitPost(post)) {
      return;
    }

    const fingerprint = buildRecruitPostFingerprint(post);

    if (seenFingerprints.has(fingerprint)) {
      return;
    }

    seenSlugs.add(post.slug);
    seenFingerprints.add(fingerprint);
    curated.push(post);
  });

  return curated;
}

export function findCuratedRecruitPost(posts: RecruitPost[], slug: string) {
  return curateRecruitPosts(posts).find((post) => post.slug === slug);
}

export function mergePosts(
  preferredPosts: RecruitPost[],
  fallbackPosts: RecruitPost[],
) {
  return curateRecruitPosts([...preferredPosts, ...fallbackPosts]);
}

export function isBrokenRecruitPost(post: RecruitPost) {
  if (
    hasInvalidRecruitDeadline(post.deadline) ||
    hasRepeatedPlaceholderFields(post)
  ) {
    return true;
  }

  return [
    post.title,
    post.campus,
    post.summary,
    post.description,
    post.stage,
    post.ownerName,
    post.ownerRole,
    post.meetingStyle,
    post.schedule,
    post.goal,
    ...post.roles,
    ...post.techStack,
    ...post.expectations,
    ...post.perks,
  ].some(isBrokenRecruitField);
}

export function filterPosts(
  posts: RecruitPost[],
  options: {
    category: "all" | RecruitCategory;
    campus: string;
    query: string;
  },
) {
  const normalizedQuery = options.query.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesCategory =
      options.category === "all" || post.category === options.category;
    const matchesCampus =
      options.campus === "all" || post.campus === options.campus;
    const haystack = [
      post.title,
      post.summary,
      post.description,
      ...post.roles,
      ...post.techStack,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

    return matchesCategory && matchesCampus && matchesQuery;
  });
}

export function getCampusOptions(posts: RecruitPost[]) {
  return ["all", ...new Set(posts.map((post) => post.campus))];
}

export function formatDateLabel(value: string) {
  if (hasInvalidRecruitDeadline(value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export function buildSlugFromTitle(title: string) {
  const compact = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Date.now().toString(36).slice(-5);
  return compact ? `${compact}-${suffix}` : `recruit-${suffix}`;
}

export function createRuntimeRecruitPost(
  input: CreateRecruitPostInput & { slug: string },
): RecruitPost {
  return {
    id: `mock_post_${Date.now()}`,
    slug: input.slug,
    title: input.title,
    category: input.category,
    campus: input.campus,
    summary: input.summary,
    description: input.description,
    roles: input.roles,
    techStack: input.techStack,
    capacity: input.capacity,
    currentMembers: 2,
    stage: input.stage,
    deadline: input.deadline,
    createdAt: new Date().toISOString(),
    highlight: true,
    ownerId: input.ownerId ?? null,
    ownerName: input.ownerName,
    ownerRole: input.ownerRole,
    meetingStyle: input.meetingStyle,
    schedule: input.schedule,
    goal: input.goal,
    expectations: [
      "정해진 기간 동안 꾸준히 참여할 수 있는 분",
      "문서와 커뮤니케이션에 적극적인 분",
      "출시까지 함께 완성도를 높일 수 있는 분",
    ],
    perks: ["배포 가능한 결과물", "실전 협업 경험", "서비스 운영 경험"],
  };
}

export function validateRecruitPostInput(input: CreateRecruitPostInput) {
  const requiredFields = [
    input.title,
    input.campus,
    input.summary,
    input.description,
    input.stage,
    input.deadline,
    input.ownerName,
    input.ownerRole,
    input.meetingStyle,
    input.schedule,
    input.goal,
  ].map(normalizeText);

  if (requiredFields.some((value) => value.length === 0) || input.roles.length === 0) {
    return "필수 입력값을 확인해주세요.";
  }

  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 20) {
    return "모집 인원은 1명 이상 20명 이하로 입력해주세요.";
  }

  if (hasInvalidRecruitDeadline(input.deadline)) {
    return "마감일을 올바르게 입력해주세요.";
  }

  const validationPost = createRuntimeRecruitPost({
    ...input,
    slug: "validation-preview",
  });

  if (isBrokenRecruitPost(validationPost)) {
    return "테스트용 또는 품질이 낮은 입력은 등록할 수 없습니다.";
  }

  return null;
}

export function createRuntimeApplication(
  input: CreateRecruitApplicationInput,
): RecruitApplication {
  return {
    id: `apply_${Date.now()}`,
    postSlug: input.postSlug,
    applicantId: input.applicantId ?? null,
    name: input.name.trim(),
    contact: input.contact.trim(),
    message: input.message.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}
