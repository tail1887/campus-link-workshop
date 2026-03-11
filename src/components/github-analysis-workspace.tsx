"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  buildGithubAnalysisSnapshot,
  getConnectedProfileUrl,
} from "@/lib/github-analysis/adapter";
import type { GithubAnalysisViewModel } from "@/lib/github-analysis/types";
import {
  isGitHubProfileUrl,
  isValidGitHubUsername,
  normalizeGitHubUsername,
} from "@/lib/ai-platform";
import type { ApiError, ApiSuccess } from "@/types/identity";
import type {
  GitHubAnalysisJob,
  GitHubAnalysisJobPayload,
  GitHubConnection,
  GitHubConnectionPayload,
} from "@/types/ai";

type GithubAnalysisWorkspaceProps = {
  model: GithubAnalysisViewModel;
};

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readApiResult<T>(response: Response) {
  return (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiError
    | null;
}

function getApiErrorMessage(
  result: ApiSuccess<unknown> | ApiError | null,
  fallback: string,
) {
  if (result && !result.success) {
    return result.error.message;
  }

  return fallback;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "아직 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getConnectionTone(status: GitHubConnection["status"] | "saving" | "guest") {
  if (status === "connected") {
    return "bg-[color:var(--teal-soft)] text-[color:var(--teal)]";
  }
  if (status === "saving") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "error") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-200 text-slate-700";
}

function getConnectionLabel(status: GitHubConnection["status"] | "saving" | "guest") {
  if (status === "saving") {
    return "saving";
  }
  if (status === "guest") {
    return "guest";
  }
  return status;
}

function getAnalysisTone(status: GitHubAnalysisJob["status"] | "idle") {
  if (status === "succeeded") {
    return "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]";
  }
  if (status === "queued" || status === "running") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "failed") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-200 text-slate-700";
}

function getAnalysisLabel(status: GitHubAnalysisJob["status"] | "idle") {
  if (status === "queued") {
    return "요청 접수";
  }
  if (status === "running") {
    return "분석 중";
  }
  if (status === "succeeded") {
    return "분석 완료";
  }
  if (status === "failed") {
    return "재시도 필요";
  }
  return "idle";
}

function canAnalyze(connection: GitHubConnection | null) {
  return connection?.status === "connected" && Boolean(connection.username);
}

export function GithubAnalysisWorkspace({
  model,
}: GithubAnalysisWorkspaceProps) {
  const [draft, setDraft] = useState(model.initialDraft);
  const [connection, setConnection] = useState<GitHubConnection | null>(
    model.initialConnection,
  );
  const [analysisJob, setAnalysisJob] = useState<GitHubAnalysisJob | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConnectionPending, setIsConnectionPending] = useState(false);
  const [isAnalysisPending, setIsAnalysisPending] = useState(false);
  const runIdRef = useRef(0);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  const analysis = buildGithubAnalysisSnapshot({
    job: analysisJob,
    context: model.profileContext,
  });
  const connectionStatus =
    model.status === "guest"
      ? "guest"
      : isConnectionPending
        ? "saving"
        : connection?.status ?? "not_connected";
  const analysisStatus = analysisJob?.status ?? (isAnalysisPending ? "running" : "idle");
  const summaryCards =
    model.status === "guest"
      ? model.summaryCards
      : [
          {
            label: "GitHub 연결",
            value:
              connection?.status === "connected" && connection.username
                ? `@${connection.username}`
                : "연결 필요",
          },
          {
            label: "최근 분석",
            value: analysisJob?.status
              ? getAnalysisLabel(analysisJob.status)
              : connection?.lastAnalysisJobId
                ? "기존 실행 감지"
                : "분석 전",
          },
          {
            label: "Provider",
            value: model.providers?.githubConnection.label ?? "Mock GitHub Connector",
          },
          {
            label: "Data Source",
            value: model.dataSourceLabel,
          },
        ];

  const pollAnalysisJob = async (
    jobId: string,
    options?: {
      initialJob?: GitHubAnalysisJob | null;
      successMessage?: string | null;
    },
  ) => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setIsAnalysisPending(true);

    try {
      let nextJob = options?.initialJob ?? null;

      if (nextJob) {
        setAnalysisJob(nextJob);
      }

      while (runId === runIdRef.current) {
        if (nextJob && nextJob.status !== "queued" && nextJob.status !== "running") {
          break;
        }

        if (nextJob) {
          await wait(900);
        }

        const response = await fetch(`/api/github/analysis/jobs/${jobId}`, {
          cache: "no-store",
        });
        const result = await readApiResult<GitHubAnalysisJobPayload>(response);

        if (!response.ok || !result?.success) {
          throw new Error(
            getApiErrorMessage(result, "GitHub 분석 상태를 불러오지 못했습니다."),
          );
        }

        nextJob = result.data.job;
        setAnalysisJob(nextJob);

        if (nextJob.status !== "queued" && nextJob.status !== "running") {
          break;
        }
      }

      if (runId !== runIdRef.current || !nextJob) {
        return false;
      }

      if (nextJob.status === "failed") {
        setError(nextJob.error?.message ?? "GitHub 분석 생성에 실패했습니다.");
        return false;
      }

      if (options?.successMessage) {
        setSuccess(options.successMessage);
      }

      return true;
    } catch (requestError) {
      if (runId === runIdRef.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "GitHub 분석을 불러오지 못했습니다.",
        );
      }
      return false;
    } finally {
      if (runId === runIdRef.current) {
        setIsAnalysisPending(false);
      }
    }
  };

  useEffect(() => {
    if (model.status !== "ready" || initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;

    if (!model.initialAnalysisJobId) {
      return;
    }

    void pollAnalysisJob(model.initialAnalysisJobId);
  }, [model.initialAnalysisJobId, model.status]);

  const startAnalysis = async (successMessage: string) => {
    if (!canAnalyze(connection)) {
      setError("분석을 시작하기 전에 GitHub 계정을 먼저 연결해주세요.");
      return false;
    }

    setError("");

    const response = await fetch("/api/github/analysis/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(model.defaultAnalysisRequest),
    });
    const result = await readApiResult<GitHubAnalysisJobPayload>(response);

    if (!response.ok || !result?.success) {
      setError(
        getApiErrorMessage(result, "GitHub 분석 요청을 시작하지 못했습니다."),
      );
      return false;
    }

    setAnalysisJob(result.data.job);
    setConnection((current) =>
      current
        ? {
            ...current,
            lastAnalysisJobId: result.data.job.id,
          }
        : current,
    );

    return pollAnalysisJob(result.data.job.id, {
      initialJob: result.data.job,
      successMessage,
    });
  };

  const handleConnect = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!model.profileContext) {
      setError("GitHub 등록은 로그인한 세션에서만 사용할 수 있습니다.");
      return;
    }

    const usernameInput = draft.username.trim() || draft.profileUrl.trim();
    const profileUrl = draft.profileUrl.trim();

    if (!usernameInput) {
      setError("GitHub username 또는 profile URL을 입력해주세요.");
      return;
    }

    if (!isValidGitHubUsername(usernameInput)) {
      setError("올바른 GitHub username 또는 profile URL을 입력해주세요.");
      return;
    }

    if (profileUrl && !isGitHubProfileUrl(profileUrl)) {
      setError("GitHub profile URL은 https://github.com/... 형식이어야 합니다.");
      return;
    }

    if (
      profileUrl &&
      normalizeGitHubUsername(profileUrl) !== normalizeGitHubUsername(usernameInput)
    ) {
      setError("username과 profile URL이 서로 다른 계정을 가리키고 있습니다.");
      return;
    }

    setIsConnectionPending(true);

    try {
      const response = await fetch("/api/github/connection", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput,
          ...(profileUrl ? { profileUrl } : {}),
        }),
      });
      const result = await readApiResult<GitHubConnectionPayload>(response);

      if (!response.ok || !result?.success) {
        setError(
          getApiErrorMessage(result, "GitHub 연결 정보를 저장하지 못했습니다."),
        );
        return;
      }

      setConnection(result.data.connection);
      setDraft({
        username: result.data.connection.username ?? "",
        profileUrl: result.data.connection.profileUrl ?? "",
      });
      setSuccess("GitHub 연결을 저장했습니다. 이어서 분석을 시작합니다.");

      const analyzed = await startAnalysis("GitHub 분석 결과를 업데이트했습니다.");

      if (!analyzed) {
        setSuccess("GitHub 연결은 저장되었습니다.");
      }
    } finally {
      setIsConnectionPending(false);
    }
  };

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    if (!canAnalyze(connection)) {
      setError("먼저 GitHub 계정을 연결한 뒤 분석을 실행해주세요.");
      return;
    }

    await startAnalysis("GitHub 분석 결과를 다시 생성했습니다.");
  };

  const handleDisconnect = async () => {
    setError("");
    setSuccess("");
    setIsConnectionPending(true);

    try {
      const response = await fetch("/api/github/connection", {
        method: "DELETE",
      });
      const result = await readApiResult<GitHubConnectionPayload>(response);

      if (!response.ok || !result?.success) {
        setError(
          getApiErrorMessage(result, "GitHub 연결을 해제하지 못했습니다."),
        );
        return;
      }

      runIdRef.current += 1;
      setConnection(result.data.connection);
      setAnalysisJob(null);
      setSuccess("GitHub 연결을 해제했습니다.");
    } finally {
      setIsConnectionPending(false);
    }
  };

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong mesh rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">{model.badge}</span>
            <h1 className="section-title text-slate-950">{model.title}</h1>
            <p className="section-subtitle">{model.subtitle}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/82 px-5 py-4 text-sm leading-7 text-[color:var(--muted)]">
            shared Phase 3 contract를 기준으로 GitHub 연결과 latest analysis
            job을 같은 경계에서 읽고 갱신합니다.
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Connection Status
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  GitHub 등록과 연결 관리
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getConnectionTone(connectionStatus)}`}
              >
                {getConnectionLabel(connectionStatus)}
              </span>
            </div>

            {model.status === "guest" ? (
              <div className="mt-5 rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                <p className="text-sm leading-7 text-[color:var(--muted)]">
                  로그인 후 GitHub username 또는 profile URL을 등록하고, shared
                  analysis job 결과를 polling으로 확인할 수 있습니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/login?next=%2Fgithub-analysis"
                    className="button-primary px-4 py-3 text-sm"
                  >
                    로그인하고 연결하기
                  </Link>
                  <Link href="/profile" className="button-ghost px-4 py-3 text-sm">
                    프로필 셸 보기
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form className="mt-5 space-y-4" onSubmit={(event) => void handleConnect(event)}>
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    GitHub username 또는 profile URL
                    <input
                      value={draft.username}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      className="field"
                      placeholder="@campus-link-demo 또는 https://github.com/campus-link-demo"
                      disabled={isConnectionPending || isAnalysisPending}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    GitHub profile URL (optional)
                    <input
                      value={draft.profileUrl}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          profileUrl: event.target.value,
                        }))
                      }
                      className="field"
                      placeholder="https://github.com/campus-link-demo"
                      disabled={isConnectionPending || isAnalysisPending}
                    />
                  </label>

                  {error ? (
                    <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  {success ? (
                    <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {success}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="button-primary px-4 py-3 text-sm"
                      disabled={isConnectionPending || isAnalysisPending}
                    >
                      {connection?.status === "connected" ? "연결 정보 갱신" : "GitHub 등록"}
                    </button>
                    <button
                      type="button"
                      className="button-secondary px-4 py-3 text-sm"
                      onClick={() => void handleRefresh()}
                      disabled={!canAnalyze(connection) || isConnectionPending || isAnalysisPending}
                    >
                      분석 다시 생성
                    </button>
                    <button
                      type="button"
                      className="button-ghost px-4 py-3 text-sm"
                      onClick={() => void handleDisconnect()}
                      disabled={isConnectionPending || isAnalysisPending}
                    >
                      연결 해제
                    </button>
                  </div>
                </form>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Provider
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {model.providers?.githubConnection.label ?? "Mock GitHub Connector"}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Last Sync
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatTimestamp(connection?.lastValidatedAt ?? null)}
                    </p>
                  </div>
                </div>

                {getConnectedProfileUrl(connection) ? (
                  <a
                    href={getConnectedProfileUrl(connection) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    연결된 GitHub 프로필 열기
                  </a>
                ) : null}
              </>
            )}
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Integration Notes
            </p>
            <div className="mt-4 grid gap-3">
              {model.notes.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Analysis Result UI
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  AI 프로젝트 분석 결과
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getAnalysisTone(analysisStatus)}`}
              >
                {getAnalysisLabel(analysisStatus)}
              </span>
            </div>

            {!analysis && !analysisJob ? (
              <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 bg-white/72 p-5 text-sm leading-7 text-[color:var(--muted)]">
                GitHub 연결을 저장한 뒤 분석을 시작하면 summary, top languages,
                recommended roles, repository insight 카드가 이 영역에 채워집니다.
              </div>
            ) : null}

            {analysisJob?.status === "queued" || analysisJob?.status === "running" ? (
              <div className="mt-5 rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {getAnalysisLabel(analysisJob.status)}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--muted)]">
                    provider {analysisJob.provider}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  첫 polling에서는 queued/running 상태가 보일 수 있고, 이후 응답에서
                  succeeded 또는 failed 상태로 전이됩니다.
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(135deg,var(--accent),var(--teal))]" />
                </div>
              </div>
            ) : null}

            {analysisJob?.status === "failed" ? (
              <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
                {analysisJob.error?.message ?? "GitHub 분석에 실패했습니다."}
              </div>
            ) : null}

            {analysis ? (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Coverage", analysis.coverageLabel],
                    ["Standout Stack", analysis.standoutStack],
                    ["Collaboration Fit", analysis.collaborationFit],
                    ["Generated", formatTimestamp(analysis.generatedAt)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        {label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Analysis Summary
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {analysis.confidenceLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {analysis.summary}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Strengths
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[color:var(--muted)]">
                      {analysis.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Recommended Roles
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {analysis.recommendedRoles.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-[color:var(--teal-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--teal)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Focus Areas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.focusAreas.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {analysis.projects.map((project) => (
                    <a
                      key={project.id}
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[1.5rem] border border-slate-200/80 bg-white/84 p-5"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-950">
                            {project.name}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                            {project.summary}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getAnalysisTone(
                            project.health === "strong"
                              ? "succeeded"
                              : project.health === "promising"
                                ? "running"
                                : "failed",
                          )}`}
                        >
                          {project.health}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          { label: "Role Fit", value: project.roleFit },
                          { label: "Activity Signal", value: project.activity },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1.2rem] bg-slate-50 px-4 py-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              {item.label}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.techStack.map((item) => (
                          <span
                            key={`${project.id}-${item}`}
                            className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          { label: "Highlights", items: project.highlights },
                          { label: "Signals", items: project.signals },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              {item.label}
                            </p>
                            <ul className="mt-2 space-y-2 text-sm leading-7 text-[color:var(--muted)]">
                              {item.items.map((entry) => (
                                <li key={entry}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { heading: "Profile Reuse", items: model.integrationPoints.profile },
              { heading: "Admin Reuse", items: model.integrationPoints.admin },
            ].map((section) => (
              <div key={section.heading} className="panel rounded-[1.8rem] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {section.heading}
                </p>
                <div className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
