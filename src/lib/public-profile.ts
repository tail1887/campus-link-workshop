import { buildAvatarDataUrl } from "@/lib/avatar";
import { categoryMeta, formatDateLabel } from "@/lib/recruit";
import type { RecruitPost } from "@/types/recruit";

export type PublicProfileModel = {
  key: string;
  name: string;
  roleLabel: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  stats: Array<{ label: string; value: string }>;
  focusTags: string[];
  campuses: string[];
  recentPosts: Array<{
    slug: string;
    title: string;
    summary: string;
    categoryLabel: string;
    deadlineLabel: string;
  }>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getRecruitAuthorKey(post: RecruitPost) {
  return post.ownerId?.trim() || slugify(post.ownerName) || post.slug;
}

export function getRecruitAuthorProfileHref(post: RecruitPost) {
  return `/people/${getRecruitAuthorKey(post)}`;
}

export function buildPublicProfileModel(ownerKey: string, posts: RecruitPost[]) {
  const authoredPosts = posts.filter((post) => getRecruitAuthorKey(post) === ownerKey);

  if (authoredPosts.length === 0) {
    return null;
  }

  const [primaryPost] = authoredPosts;
  const focusTags = [...new Set(authoredPosts.flatMap((post) => post.techStack))].slice(0, 8);
  const campuses = [...new Set(authoredPosts.map((post) => post.campus))];
  const openRoles = authoredPosts.reduce((count, post) => count + post.capacity, 0);

  return {
    key: ownerKey,
    name: primaryPost.ownerName,
    roleLabel: primaryPost.ownerRole,
    avatarUrl: buildAvatarDataUrl(ownerKey, primaryPost.ownerName),
    headline: `${primaryPost.ownerRole}로 ${primaryPost.goal}을 이끄는 캠퍼스 메이커`,
    bio: `${primaryPost.description.split("\n")[0]} 현재 ${authoredPosts.length}개의 모집 흐름을 운영 중이며, ${campuses.join(", ")} 기반으로 팀 빌딩을 진행하고 있습니다.`,
    stats: [
      { label: "운영 중인 모집", value: `${authoredPosts.length}개` },
      { label: "열린 포지션", value: `${openRoles}명` },
      { label: "가장 가까운 마감", value: formatDateLabel(primaryPost.deadline) },
    ],
    focusTags,
    campuses,
    recentPosts: authoredPosts.slice(0, 4).map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      categoryLabel: categoryMeta[post.category].label,
      deadlineLabel: formatDateLabel(post.deadline),
    })),
  } satisfies PublicProfileModel;
}
