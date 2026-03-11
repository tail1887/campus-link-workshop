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
import { withRepositoryFallback } from "@/lib/server/repository-fallback";
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
  if (getIdentityDataSource() !== "database") {
    return getMockGitHubConnectionRecord(user);
  }

  return withRepositoryFallback({
    scope: "ai-platform.getGitHubConnectionRecord",
    database: async () => {
      assertDatabaseConfigured();
      return getPrismaGitHubConnectionRecord(user);
    },
    mock: () => getMockGitHubConnectionRecord(user),
  });
}

export async function upsertGitHubConnectionRecord(
  user: User,
  input: UpdateGitHubConnectionRequest,
) {
  if (getIdentityDataSource() !== "database") {
    return upsertMockGitHubConnectionRecord(user, input);
  }

  return withRepositoryFallback({
    scope: "ai-platform.upsertGitHubConnectionRecord",
    database: async () => {
      assertDatabaseConfigured();
      return upsertPrismaGitHubConnectionRecord(user, input);
    },
    mock: () => upsertMockGitHubConnectionRecord(user, input),
  });
}

export async function disconnectGitHubConnectionRecord(user: User) {
  if (getIdentityDataSource() !== "database") {
    return disconnectMockGitHubConnectionRecord(user);
  }

  return withRepositoryFallback({
    scope: "ai-platform.disconnectGitHubConnectionRecord",
    database: async () => {
      assertDatabaseConfigured();
      return disconnectPrismaGitHubConnectionRecord(user);
    },
    mock: () => disconnectMockGitHubConnectionRecord(user),
  });
}

export async function createGitHubAnalysisJobRecord(
  user: User,
  input: CreateGitHubAnalysisJobInput,
) {
  if (getIdentityDataSource() !== "database") {
    return createMockGitHubAnalysisJobRecord(user, input);
  }

  return withRepositoryFallback({
    scope: "ai-platform.createGitHubAnalysisJobRecord",
    database: async () => {
      assertDatabaseConfigured();
      return createPrismaGitHubAnalysisJobRecord(user, input);
    },
    mock: () => createMockGitHubAnalysisJobRecord(user, input),
  });
}

export async function getGitHubAnalysisJobRecord(user: User, jobId: string) {
  if (getIdentityDataSource() !== "database") {
    return getMockGitHubAnalysisJobRecord(user, jobId);
  }

  return withRepositoryFallback({
    scope: "ai-platform.getGitHubAnalysisJobRecord",
    database: async () => {
      assertDatabaseConfigured();
      return getPrismaGitHubAnalysisJobRecord(user, jobId);
    },
    mock: () => getMockGitHubAnalysisJobRecord(user, jobId),
  });
}

export async function createAiSuggestionJobRecord(
  user: User,
  request: CreateAiSuggestionJobRequest,
) {
  if (getIdentityDataSource() !== "database") {
    return createMockAiSuggestionJobRecord(user, request);
  }

  return withRepositoryFallback({
    scope: "ai-platform.createAiSuggestionJobRecord",
    database: async () => {
      assertDatabaseConfigured();
      return createPrismaAiSuggestionJobRecord(user, request);
    },
    mock: () => createMockAiSuggestionJobRecord(user, request),
  });
}

export async function getAiSuggestionJobRecord(user: User, jobId: string) {
  if (getIdentityDataSource() !== "database") {
    return getMockAiSuggestionJobRecord(user, jobId);
  }

  return withRepositoryFallback({
    scope: "ai-platform.getAiSuggestionJobRecord",
    database: async () => {
      assertDatabaseConfigured();
      return getPrismaAiSuggestionJobRecord(user, jobId);
    },
    mock: () => getMockAiSuggestionJobRecord(user, jobId),
  });
}
