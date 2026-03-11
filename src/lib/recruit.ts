import type {
  CreateRecruitApplicationInput,
  CreateRecruitPostInput,
  RecruitApplication,
  RecruitCategory,
  RecruitPost,
} from "@/types/recruit";

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

export function mergePosts(
  preferredPosts: RecruitPost[],
  fallbackPosts: RecruitPost[],
) {
  const seen = new Set<string>();
  const merged: RecruitPost[] = [];

  [...preferredPosts, ...fallbackPosts].forEach((post) => {
    if (seen.has(post.slug) || isBrokenRecruitPost(post)) {
      return;
    }

    seen.add(post.slug);
    merged.push(post);
  });

  return merged.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

function containsBrokenText(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return normalized.includes("�") || /\?[\s?]*\?/.test(normalized);
}

export function isBrokenRecruitPost(post: RecruitPost) {
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
  ].some(containsBrokenText);
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
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(value));
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
      "발표까지 함께 마무리할 수 있는 분",
    ],
    perks: ["즉시 시연 가능한 결과물", "협업 데모 경험", "배포 경험"],
  };
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
