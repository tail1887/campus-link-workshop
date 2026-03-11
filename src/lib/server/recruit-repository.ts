import {
  createRuntimeApplication,
  createRuntimeRecruitPost,
} from "@/lib/recruit";
import {
  createMockApplication,
  createMockPost,
  findMockPost,
  hasMockDuplicateApplication,
  listMockApplicationsByApplicant,
  listMockPosts,
} from "@/lib/server/mock-recruit-repository";
import {
  createPrismaApplication,
  createPrismaPost,
  findPrismaPost,
  hasPrismaDuplicateApplication,
  listPrismaApplicationsByApplicant,
  listPrismaPosts,
} from "@/lib/server/prisma-recruit-repository";
import {
  getConfiguredDataSource,
  withRepositoryFallback,
} from "@/lib/server/repository-fallback";
import type {
  CreateRecruitApplicationInput,
  CreateRecruitPostInput,
} from "@/types/recruit";

export type RecruitDataSource = "mock" | "database";

export function getRecruitDataSource(): RecruitDataSource {
  return getConfiguredDataSource();
}

export async function listRecruitPosts() {
  return withRepositoryFallback({
    scope: "recruit.listRecruitPosts",
    database: () => listPrismaPosts(),
    mock: () => listMockPosts(),
  });
}

export async function findRecruitPost(slug: string) {
  return withRepositoryFallback({
    scope: "recruit.findRecruitPost",
    database: () => findPrismaPost(slug),
    mock: () => findMockPost(slug),
  });
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
