import { randomUUID } from "node:crypto";
import {
  buildAiJobError,
  buildDefaultGitHubConnection,
  hasGitHubConnection,
  normalizeCreateAiSuggestionJobRequest,
  normalizeGitHubAnalysisJobRequest,
  normalizeGitHubConnectionRequest,
} from "@/lib/ai-platform";
import {
  executeAiSuggestions,
  executeGitHubAnalysis,
  getAiPlatformProviderCatalog,
} from "@/lib/server/ai-platform-provider";
import type {
  AiSuggestionJob,
  CreateAiSuggestionJobRequest,
  CreateGitHubAnalysisJobInput,
  GitHubAnalysisJob,
  GitHubConnection,
  UpdateGitHubConnectionRequest,
} from "@/types/ai";
import type { User } from "@/types/identity";

const seedCreatedAt = new Date("2026-03-11T00:00:00.000Z").toISOString();
const providers = getAiPlatformProviderCatalog();

const mockConnections = new Map<string, GitHubConnection>([
  [
    "user_demo_student",
    buildDefaultGitHubConnection("user_demo_student", {
      username: "campus-link-demo",
      profileUrl: "https://github.com/campus-link-demo",
      provider: providers.githubConnection.provider,
      status: "connected",
      connectedAt: seedCreatedAt,
      lastValidatedAt: seedCreatedAt,
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    }),
  ],
]);

const mockGitHubAnalysisJobs = new Map<string, GitHubAnalysisJob>();
const mockAiSuggestionJobs = new Map<string, AiSuggestionJob>();

function ensureConnection(user: User) {
  const existing = mockConnections.get(user.id);

  if (existing) {
    return existing;
  }

  const created = buildDefaultGitHubConnection(user.id, {
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    provider: providers.githubConnection.provider,
  });
  mockConnections.set(user.id, created);
  return created;
}

export function getMockGitHubConnectionRecord(user: User) {
  return ensureConnection(user);
}

export function upsertMockGitHubConnectionRecord(
  user: User,
  input: UpdateGitHubConnectionRequest,
) {
  const current = ensureConnection(user);
  const normalized = normalizeGitHubConnectionRequest(input);
  const now = new Date().toISOString();

  const nextConnection: GitHubConnection = {
    ...current,
    username: normalized.username,
    profileUrl: normalized.profileUrl,
    provider: providers.githubConnection.provider,
    status: "connected",
    connectedAt: current.connectedAt ?? now,
    lastValidatedAt: now,
    updatedAt: now,
  };

  mockConnections.set(user.id, nextConnection);
  return nextConnection;
}

export function disconnectMockGitHubConnectionRecord(user: User) {
  const current = ensureConnection(user);
  const now = new Date().toISOString();

  const nextConnection: GitHubConnection = {
    ...current,
    username: null,
    profileUrl: null,
    status: "not_connected",
    connectedAt: null,
    lastValidatedAt: null,
    lastAnalysisJobId: null,
    updatedAt: now,
  };

  mockConnections.set(user.id, nextConnection);
  return nextConnection;
}

export function createMockGitHubAnalysisJobRecord(
  user: User,
  input: CreateGitHubAnalysisJobInput,
) {
  const connection = ensureConnection(user);

  if (!hasGitHubConnection(connection)) {
    return null;
  }

  const now = new Date().toISOString();
  const job: GitHubAnalysisJob = {
    id: randomUUID(),
    userId: user.id,
    kind: "github_analysis",
    status: "queued",
    provider: providers.githubAnalysis.provider,
    request: normalizeGitHubAnalysisJobRequest(input),
    result: null,
    error: null,
    requestedAt: now,
    startedAt: null,
    completedAt: null,
    updatedAt: now,
  };

  mockGitHubAnalysisJobs.set(job.id, job);
  mockConnections.set(user.id, {
    ...connection,
    lastAnalysisJobId: job.id,
    updatedAt: now,
  });

  return job;
}

export async function getMockGitHubAnalysisJobRecord(user: User, jobId: string) {
  const job = mockGitHubAnalysisJobs.get(jobId);

  if (!job || job.userId !== user.id) {
    return null;
  }

  if (job.status === "queued") {
    const runningJob: GitHubAnalysisJob = {
      ...job,
      status: "running",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGitHubAnalysisJobs.set(jobId, runningJob);
    return runningJob;
  }

  if (job.status !== "running") {
    return job;
  }

  const connection = ensureConnection(user);
  const now = new Date().toISOString();

  if (!hasGitHubConnection(connection)) {
    const failedJob: GitHubAnalysisJob = {
      ...job,
      status: "failed",
      error: buildAiJobError(
        "GITHUB_CONNECTION_REQUIRED",
        "GitHub 연결이 없어 분석을 계속할 수 없습니다.",
        true,
      ),
      completedAt: now,
      updatedAt: now,
    };
    mockGitHubAnalysisJobs.set(jobId, failedJob);
    return failedJob;
  }

  try {
    const result = await executeGitHubAnalysis({
      user,
      connection,
      request: job.request,
    });

    const succeededJob: GitHubAnalysisJob = {
      ...job,
      status: "succeeded",
      result,
      error: null,
      completedAt: now,
      updatedAt: now,
    };
    mockGitHubAnalysisJobs.set(jobId, succeededJob);
    return succeededJob;
  } catch {
    const failedJob: GitHubAnalysisJob = {
      ...job,
      status: "failed",
      error: buildAiJobError(
        "UPSTREAM_FAILED",
        "GitHub 분석 provider 응답을 가져오지 못했습니다.",
        true,
      ),
      completedAt: now,
      updatedAt: now,
    };
    mockGitHubAnalysisJobs.set(jobId, failedJob);
    return failedJob;
  }
}

export function createMockAiSuggestionJobRecord(
  user: User,
  request: CreateAiSuggestionJobRequest,
) {
  const now = new Date().toISOString();
  const job: AiSuggestionJob = {
    id: randomUUID(),
    userId: user.id,
    kind: "ai_suggestion",
    status: "queued",
    provider: providers.aiSuggestion.provider,
    request: normalizeCreateAiSuggestionJobRequest(request),
    result: null,
    error: null,
    requestedAt: now,
    startedAt: null,
    completedAt: null,
    updatedAt: now,
  };

  mockAiSuggestionJobs.set(job.id, job);
  return job;
}

export async function getMockAiSuggestionJobRecord(user: User, jobId: string) {
  const job = mockAiSuggestionJobs.get(jobId);

  if (!job || job.userId !== user.id) {
    return null;
  }

  if (job.status === "queued") {
    const runningJob: AiSuggestionJob = {
      ...job,
      status: "running",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAiSuggestionJobs.set(jobId, runningJob);
    return runningJob;
  }

  if (job.status !== "running") {
    return job;
  }

  const now = new Date().toISOString();

  try {
    const result = await executeAiSuggestions({
      user,
      request: job.request,
    });

    const succeededJob: AiSuggestionJob = {
      ...job,
      status: "succeeded",
      result,
      error: null,
      completedAt: now,
      updatedAt: now,
    };
    mockAiSuggestionJobs.set(jobId, succeededJob);
    return succeededJob;
  } catch {
    const failedJob: AiSuggestionJob = {
      ...job,
      status: "failed",
      error: buildAiJobError(
        "UPSTREAM_FAILED",
        "AI suggestion provider 응답을 가져오지 못했습니다.",
        true,
      ),
      completedAt: now,
      updatedAt: now,
    };
    mockAiSuggestionJobs.set(jobId, failedJob);
    return failedJob;
  }
}
