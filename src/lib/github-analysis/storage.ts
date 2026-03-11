"use client";

import type {
  GithubAnalysisSnapshot,
  GithubAnalysisStorageRecord,
  GithubConnectionRecord,
} from "@/lib/github-analysis/types";

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorageKey(userId: string) {
  return `campus-link.github-analysis.v1:${userId}`;
}

function isConnectionRecord(value: unknown): value is GithubConnectionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.username === "string" &&
    typeof candidate.profileUrl === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.repositoryCount === "number" &&
    typeof candidate.connectedAt === "string" &&
    (candidate.lastSyncedAt === null || typeof candidate.lastSyncedAt === "string")
  );
}

function isAnalysisSnapshot(value: unknown): value is GithubAnalysisSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.state === "string" &&
    (candidate.generatedAt === null || typeof candidate.generatedAt === "string") &&
    typeof candidate.coverageLabel === "string" &&
    typeof candidate.standoutStack === "string" &&
    typeof candidate.collaborationFit === "string" &&
    typeof candidate.confidenceLabel === "string" &&
    Array.isArray(candidate.focusAreas) &&
    Array.isArray(candidate.notes) &&
    Array.isArray(candidate.projects)
  );
}

export function readGithubAnalysisStorage(
  userId: string,
): GithubAnalysisStorageRecord | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      connection?: unknown;
      analysis?: unknown;
    };

    return {
      connection: isConnectionRecord(parsed.connection) ? parsed.connection : null,
      analysis: isAnalysisSnapshot(parsed.analysis) ? parsed.analysis : null,
    };
  } catch {
    return null;
  }
}

export function writeGithubAnalysisStorage(
  userId: string,
  value: GithubAnalysisStorageRecord,
) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(value));
}

export function clearGithubAnalysisStorage(userId: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(getStorageKey(userId));
}
