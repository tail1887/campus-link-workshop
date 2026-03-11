import { Prisma } from "@prisma/client";
import {
  buildAiJobError,
  buildDefaultGitHubConnection,
  hasGitHubConnection,
  normalizeCreateAiSuggestionJobRequest,
  normalizeGitHubAnalysisJobRequest,
  normalizeGitHubConnectionRequest,
} from "@/lib/ai-platform";
import { prisma } from "@/lib/server/prisma";
import {
  executeAiSuggestions,
  executeGitHubAnalysis,
  getAiPlatformProviderCatalog,
} from "@/lib/server/ai-platform-provider";
import type {
  AiJobErrorCode,
  AiSuggestionJob,
  CreateAiSuggestionJobRequest,
  CreateGitHubAnalysisJobInput,
  GitHubAnalysisJob,
  GitHubConnection,
  UpdateGitHubConnectionRequest,
} from "@/types/ai";
import type { User } from "@/types/identity";

const providers = getAiPlatformProviderCatalog();

const phase3Prisma = prisma as typeof prisma & {
  githubConnection: {
    findUnique: (args: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  aiJob: {
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

function jsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function mapGitHubConnection(record: {
  userId: string;
  username: string | null;
  profileUrl: string | null;
  provider: string;
  status: GitHubConnection["status"];
  connectedAt: Date | null;
  lastValidatedAt: Date | null;
  lastAnalysisJobId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GitHubConnection {
  return {
    userId: record.userId,
    username: record.username,
    profileUrl: record.profileUrl,
    provider: record.provider as GitHubConnection["provider"],
    status: record.status,
    connectedAt: record.connectedAt?.toISOString() ?? null,
    lastValidatedAt: record.lastValidatedAt?.toISOString() ?? null,
    lastAnalysisJobId: record.lastAnalysisJobId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapGitHubAnalysisJob(record: {
  id: string;
  userId: string;
  kind: GitHubAnalysisJob["kind"];
  status: GitHubAnalysisJob["status"];
  provider: string;
  request: Prisma.JsonValue;
  result: Prisma.JsonValue | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}): GitHubAnalysisJob {
  return {
    id: record.id,
    userId: record.userId,
    kind: record.kind,
    status: record.status,
    provider: record.provider as GitHubAnalysisJob["provider"],
    request: record.request as GitHubAnalysisJob["request"],
    result: (record.result as GitHubAnalysisJob["result"]) ?? null,
    error:
      record.errorCode && record.errorMessage
        ? buildAiJobError(
            record.errorCode as AiJobErrorCode,
            record.errorMessage,
            true,
          )
        : null,
    requestedAt: record.requestedAt.toISOString(),
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapAiSuggestionJob(record: {
  id: string;
  userId: string;
  kind: AiSuggestionJob["kind"];
  status: AiSuggestionJob["status"];
  provider: string;
  request: Prisma.JsonValue;
  result: Prisma.JsonValue | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}): AiSuggestionJob {
  return {
    id: record.id,
    userId: record.userId,
    kind: record.kind,
    status: record.status,
    provider: record.provider as AiSuggestionJob["provider"],
    request: record.request as AiSuggestionJob["request"],
    result: (record.result as AiSuggestionJob["result"]) ?? null,
    error:
      record.errorCode && record.errorMessage
        ? buildAiJobError(
            record.errorCode as AiJobErrorCode,
            record.errorMessage,
            true,
          )
        : null,
    requestedAt: record.requestedAt.toISOString(),
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getPrismaGitHubConnectionRecord(user: User) {
  const record = (await phase3Prisma.githubConnection.findUnique({
    where: {
      userId: user.id,
    },
  })) as Parameters<typeof mapGitHubConnection>[0] | null;

  return record
    ? mapGitHubConnection(record)
    : buildDefaultGitHubConnection(user.id, {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        provider: providers.githubConnection.provider,
      });
}

export async function upsertPrismaGitHubConnectionRecord(
  user: User,
  input: UpdateGitHubConnectionRequest,
) {
  const current = await getPrismaGitHubConnectionRecord(user);
  const normalized = normalizeGitHubConnectionRequest(input);
  const now = new Date().toISOString();

  const record = (await phase3Prisma.githubConnection.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      username: normalized.username,
      profileUrl: normalized.profileUrl,
      provider: providers.githubConnection.provider,
      status: "connected",
      connectedAt: current.connectedAt
        ? new Date(current.connectedAt)
        : new Date(now),
      lastValidatedAt: new Date(now),
      createdAt: new Date(current.createdAt),
    },
    update: {
      username: normalized.username,
      profileUrl: normalized.profileUrl,
      provider: providers.githubConnection.provider,
      status: "connected",
      connectedAt: current.connectedAt
        ? new Date(current.connectedAt)
        : new Date(now),
      lastValidatedAt: new Date(now),
    },
  })) as Parameters<typeof mapGitHubConnection>[0];

  return mapGitHubConnection(record);
}

export async function disconnectPrismaGitHubConnectionRecord(user: User) {
  const current = await getPrismaGitHubConnectionRecord(user);

  const record = (await phase3Prisma.githubConnection.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      username: null,
      profileUrl: null,
      provider: providers.githubConnection.provider,
      status: "not_connected",
      connectedAt: null,
      lastValidatedAt: null,
      lastAnalysisJobId: null,
      createdAt: new Date(current.createdAt),
    },
    update: {
      username: null,
      profileUrl: null,
      status: "not_connected",
      connectedAt: null,
      lastValidatedAt: null,
      lastAnalysisJobId: null,
    },
  })) as Parameters<typeof mapGitHubConnection>[0];

  return mapGitHubConnection(record);
}

export async function createPrismaGitHubAnalysisJobRecord(
  user: User,
  input: CreateGitHubAnalysisJobInput,
) {
  const connection = await getPrismaGitHubConnectionRecord(user);

  if (!hasGitHubConnection(connection)) {
    return null;
  }

  const request = normalizeGitHubAnalysisJobRequest(input);

  const record = (await phase3Prisma.aiJob.create({
    data: {
      userId: user.id,
      kind: "github_analysis",
      status: "queued",
      provider: providers.githubAnalysis.provider,
      request: jsonValue(request),
      requestedAt: new Date(),
    },
  })) as Parameters<typeof mapGitHubAnalysisJob>[0];

  await phase3Prisma.githubConnection.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      username: connection.username,
      profileUrl: connection.profileUrl,
      provider: connection.provider,
      status: connection.status,
      connectedAt: connection.connectedAt
        ? new Date(connection.connectedAt)
        : null,
      lastValidatedAt: connection.lastValidatedAt
        ? new Date(connection.lastValidatedAt)
        : null,
      lastAnalysisJobId: record.id,
      createdAt: new Date(connection.createdAt),
    },
    update: {
      lastAnalysisJobId: record.id,
    },
  });

  return mapGitHubAnalysisJob(record);
}

export async function getPrismaGitHubAnalysisJobRecord(user: User, jobId: string) {
  const record = (await phase3Prisma.aiJob.findUnique({
    where: {
      id: jobId,
    },
  })) as Parameters<typeof mapGitHubAnalysisJob>[0] | null;

  if (!record || record.userId !== user.id || record.kind !== "github_analysis") {
    return null;
  }

  if (record.status === "queued") {
    const runningRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "running",
        startedAt: new Date(),
      },
    })) as Parameters<typeof mapGitHubAnalysisJob>[0];

    return mapGitHubAnalysisJob(runningRecord);
  }

  if (record.status !== "running") {
    return mapGitHubAnalysisJob(record);
  }

  const connection = await getPrismaGitHubConnectionRecord(user);
  const now = new Date();

  if (!hasGitHubConnection(connection)) {
    const failedRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "failed",
        errorCode: "GITHUB_CONNECTION_REQUIRED",
        errorMessage: "GitHub 연결이 없어 분석을 계속할 수 없습니다.",
        completedAt: now,
      },
    })) as Parameters<typeof mapGitHubAnalysisJob>[0];

    return mapGitHubAnalysisJob(failedRecord);
  }

  try {
    const result = await executeGitHubAnalysis({
      user,
      connection,
      request: record.request as GitHubAnalysisJob["request"],
    });

    const succeededRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "succeeded",
        result: jsonValue(result),
        errorCode: null,
        errorMessage: null,
        completedAt: now,
      },
    })) as Parameters<typeof mapGitHubAnalysisJob>[0];

    return mapGitHubAnalysisJob(succeededRecord);
  } catch {
    const failedRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "failed",
        errorCode: "UPSTREAM_FAILED",
        errorMessage: "GitHub 분석 provider 응답을 가져오지 못했습니다.",
        completedAt: now,
      },
    })) as Parameters<typeof mapGitHubAnalysisJob>[0];

    return mapGitHubAnalysisJob(failedRecord);
  }
}

export async function createPrismaAiSuggestionJobRecord(
  user: User,
  request: CreateAiSuggestionJobRequest,
) {
  const normalizedRequest = normalizeCreateAiSuggestionJobRequest(request);

  const record = (await phase3Prisma.aiJob.create({
    data: {
      userId: user.id,
      kind: "ai_suggestion",
      status: "queued",
      provider: providers.aiSuggestion.provider,
      request: jsonValue(normalizedRequest),
      requestedAt: new Date(),
    },
  })) as Parameters<typeof mapAiSuggestionJob>[0];

  return mapAiSuggestionJob(record);
}

export async function getPrismaAiSuggestionJobRecord(user: User, jobId: string) {
  const record = (await phase3Prisma.aiJob.findUnique({
    where: {
      id: jobId,
    },
  })) as Parameters<typeof mapAiSuggestionJob>[0] | null;

  if (!record || record.userId !== user.id || record.kind !== "ai_suggestion") {
    return null;
  }

  if (record.status === "queued") {
    const runningRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "running",
        startedAt: new Date(),
      },
    })) as Parameters<typeof mapAiSuggestionJob>[0];

    return mapAiSuggestionJob(runningRecord);
  }

  if (record.status !== "running") {
    return mapAiSuggestionJob(record);
  }

  const now = new Date();

  try {
    const result = await executeAiSuggestions({
      user,
      request: record.request as AiSuggestionJob["request"],
    });

    const succeededRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "succeeded",
        result: jsonValue(result),
        errorCode: null,
        errorMessage: null,
        completedAt: now,
      },
    })) as Parameters<typeof mapAiSuggestionJob>[0];

    return mapAiSuggestionJob(succeededRecord);
  } catch {
    const failedRecord = (await phase3Prisma.aiJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "failed",
        errorCode: "UPSTREAM_FAILED",
        errorMessage: "AI suggestion provider 응답을 가져오지 못했습니다.",
        completedAt: now,
      },
    })) as Parameters<typeof mapAiSuggestionJob>[0];

    return mapAiSuggestionJob(failedRecord);
  }
}
