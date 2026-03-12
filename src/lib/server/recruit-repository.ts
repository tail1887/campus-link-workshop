import { recruitPosts as canonicalRecruitPosts } from "@/data/recruit-posts";
import {
  curateRecruitPosts,
  createRuntimeApplication,
  findCuratedRecruitPost,
  createRuntimeRecruitPost,
  isBrokenRecruitPost,
} from "@/lib/recruit";
import {
  createMockApplication,
  createMockPost,
  hasMockDuplicateApplication,
  listMockApplicationsByApplicant,
  listMockPosts,
} from "@/lib/server/mock-recruit-repository";
import {
  createPrismaApplication,
  createPrismaPost,
  hasPrismaDuplicateApplication,
  listPrismaApplicationsByApplicant,
  listPrismaPosts,
} from "@/lib/server/prisma-recruit-repository";
import {
  getConfiguredDataSource,
  logRepositoryFallback,
  withRepositoryFallback,
} from "@/lib/server/repository-fallback";
import type {
  CreateRecruitApplicationInput,
  CreateRecruitPostInput,
  RecruitPost,
} from "@/types/recruit";

export type RecruitDataSource = "mock" | "database";

export function getRecruitDataSource(): RecruitDataSource {
  return getConfiguredDataSource();
}

function getCanonicalRecruitPosts() {
  return curateRecruitPosts(canonicalRecruitPosts);
}

function repairCorruptedSeedPosts(posts: RecruitPost[]) {
  const canonicalBySlug = new Map(
    canonicalRecruitPosts.map((post) => [post.slug, post]),
  );

  return posts.map((post) => {
    const canonicalPost = canonicalBySlug.get(post.slug);

    if (!canonicalPost || !isBrokenRecruitPost(post)) {
      return post;
    }

    return {
      ...post,
      ...canonicalPost,
      id: post.id,
      slug: post.slug,
      createdAt: post.createdAt,
      ownerId: post.ownerId ?? canonicalPost.ownerId ?? null,
      currentMembers: post.currentMembers,
      highlight: post.highlight,
    };
  });
}

export async function listRecruitPosts() {
  try {
    const posts = await withRepositoryFallback({
      scope: "recruit.listRecruitPosts",
      database: () => listPrismaPosts(),
      mock: () => listMockPosts(),
    });

    return curateRecruitPosts(repairCorruptedSeedPosts(posts));
  } catch (error) {
    logRepositoryFallback(
      "recruit.listRecruitPosts: post curation failed; falling back to canonical seed posts",
      error,
    );
    return getCanonicalRecruitPosts();
  }
}

export async function findRecruitPost(slug: string) {
  try {
    const posts = await withRepositoryFallback({
      scope: "recruit.findRecruitPost",
      database: () => listPrismaPosts(),
      mock: () => listMockPosts(),
    });

    return findCuratedRecruitPost(repairCorruptedSeedPosts(posts), slug);
  } catch (error) {
    logRepositoryFallback(
      `recruit.findRecruitPost(${slug}): post curation failed; falling back to canonical seed posts`,
      error,
    );
    return findCuratedRecruitPost(getCanonicalRecruitPosts(), slug);
  }
}

export async function createRecruitPost(
  input: CreateRecruitPostInput & { slug: string },
) {
  return withRepositoryFallback({
    scope: "recruit.createRecruitPost",
    database: () => createPrismaPost(input),
    mock: () => createMockPost(createRuntimeRecruitPost(input)),
  });
}

export async function hasDuplicateApplication(postSlug: string, contact: string) {
  return withRepositoryFallback({
    scope: "recruit.hasDuplicateApplication",
    database: () => hasPrismaDuplicateApplication(postSlug, contact),
    mock: () => hasMockDuplicateApplication(postSlug, contact),
  });
}

export async function listRecruitApplicationsByApplicant(applicantId: string) {
  return withRepositoryFallback({
    scope: "recruit.listRecruitApplicationsByApplicant",
    database: () => listPrismaApplicationsByApplicant(applicantId),
    mock: () => listMockApplicationsByApplicant(applicantId),
  });
}

export async function createRecruitApplication(
  input: CreateRecruitApplicationInput,
) {
  return withRepositoryFallback({
    scope: "recruit.createRecruitApplication",
    database: () => createPrismaApplication(input),
    mock: () => createMockApplication(createRuntimeApplication(input)),
  });
}
