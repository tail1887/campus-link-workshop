import {
  createMockAiSuggestionJobRecord,
  createMockGitHubAnalysisJobRecord,
  disconnectMockGitHubConnectionRecord,
  getMockAiSuggestionJobRecord,
  getMockGitHubAnalysisJobRecord,
  getMockGitHubConnectionRecord,
  upsertMockGitHubConnectionRecord,
} from "@/lib/server/mock-ai-platform-repository";
import {
  createPrismaAiSuggestionJobRecord,
  createPrismaGitHubAnalysisJobRecord,
  disconnectPrismaGitHubConnectionRecord,
  getPrismaAiSuggestionJobRecord,
  getPrismaGitHubAnalysisJobRecord,
  getPrismaGitHubConnectionRecord,
  upsertPrismaGitHubConnectionRecord,
} from "@/lib/server/prisma-ai-platform-repository";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import type {
  CreateAiSuggestionJobRequest,
  CreateGitHubAnalysisJobInput,
  UpdateGitHubConnectionRequest,
} from "@/types/ai";
import type { User } from "@/types/identity";

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when RECRUIT_DATA_SOURCE=database.",
    );
  }
}

export async function getGitHubConnectionRecord(user: User) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaGitHubConnectionRecord(user);
  }

  return getMockGitHubConnectionRecord(user);
}

export async function upsertGitHubConnectionRecord(
  user: User,
  input: UpdateGitHubConnectionRequest,
) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return upsertPrismaGitHubConnectionRecord(user, input);
  }

  return upsertMockGitHubConnectionRecord(user, input);
}

export async function disconnectGitHubConnectionRecord(user: User) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return disconnectPrismaGitHubConnectionRecord(user);
  }

  return disconnectMockGitHubConnectionRecord(user);
}

export async function createGitHubAnalysisJobRecord(
  user: User,
  input: CreateGitHubAnalysisJobInput,
) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaGitHubAnalysisJobRecord(user, input);
  }

  return createMockGitHubAnalysisJobRecord(user, input);
}

export async function getGitHubAnalysisJobRecord(user: User, jobId: string) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaGitHubAnalysisJobRecord(user, jobId);
  }

  return getMockGitHubAnalysisJobRecord(user, jobId);
}

export async function createAiSuggestionJobRecord(
  user: User,
  request: CreateAiSuggestionJobRequest,
) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaAiSuggestionJobRecord(user, request);
  }

  return createMockAiSuggestionJobRecord(user, request);
}

export async function getAiSuggestionJobRecord(user: User, jobId: string) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaAiSuggestionJobRecord(user, jobId);
  }

  return getMockAiSuggestionJobRecord(user, jobId);
}
