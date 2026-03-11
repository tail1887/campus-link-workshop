import {
  createRuntimeApplication,
  createRuntimeRecruitPost,
} from "@/lib/recruit";
import {
  createMockApplication,
  createMockPost,
  findMockPost,
  hasMockDuplicateApplication,
  listMockPosts,
} from "@/lib/server/mock-recruit-repository";
import {
  createPrismaApplication,
  createPrismaPost,
  findPrismaPost,
  hasPrismaDuplicateApplication,
  listPrismaPosts,
} from "@/lib/server/prisma-recruit-repository";
import type {
  CreateRecruitApplicationInput,
  CreateRecruitPostInput,
} from "@/types/recruit";

export type RecruitDataSource = "mock" | "database";

export function getRecruitDataSource(): RecruitDataSource {
  return process.env.RECRUIT_DATA_SOURCE === "database" ? "database" : "mock";
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when RECRUIT_DATA_SOURCE=database.",
    );
  }
}

export async function listRecruitPosts() {
  if (getRecruitDataSource() === "database") {
    assertDatabaseConfigured();
    return listPrismaPosts();
  }

  return listMockPosts();
}

export async function findRecruitPost(slug: string) {
  if (getRecruitDataSource() === "database") {
    assertDatabaseConfigured();
    return findPrismaPost(slug);
  }

  return findMockPost(slug);
}

export async function createRecruitPost(
  input: CreateRecruitPostInput & { slug: string },
) {
  if (getRecruitDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaPost(input);
  }

  return createMockPost(createRuntimeRecruitPost(input));
}

export async function hasDuplicateApplication(postSlug: string, contact: string) {
  if (getRecruitDataSource() === "database") {
    assertDatabaseConfigured();
    return hasPrismaDuplicateApplication(postSlug, contact);
  }

  return hasMockDuplicateApplication(postSlug, contact);
}

export async function createRecruitApplication(
  input: CreateRecruitApplicationInput,
) {
  if (getRecruitDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaApplication(input);
  }

  return createMockApplication(createRuntimeApplication(input));
}
