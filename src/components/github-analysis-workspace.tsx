"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  buildBranchLocalAnalysis,
  buildBranchLocalConnection,
} from "@/lib/github-analysis/adapter";
import {
  clearGithubAnalysisStorage,
  readGithubAnalysisStorage,
  writeGithubAnalysisStorage,
} from "@/lib/github-analysis/storage";
import type {
  GithubAnalysisViewModel,
  GithubConnectionDraft,
  GithubConnectionRecord,
} from "@/lib/github-analysis/types";
import { isValidHttpUrl } from "@/lib/profile";

type GithubAnalysisWorkspaceProps = {
  model: GithubAnalysisViewModel;
};

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

function getConnectionTone(status: GithubConnectionRecord["status"] | "guest") {
  if (status === "connected") {
    return "bg-[color:var(--teal-soft)] text-[color:var(--teal)]";
  }

  if (status === "syncing") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "attention") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-200 text-slate-700";
}

function getAnalysisTone(state: string) {
  if (state === "ready") {
    return "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]";
  }

  if (state === "refreshing") {
    return "bg-amber-100 text-amber-700";
  }

  if (state === "failed") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-200 text-slate-700";
}

export function GithubAnalysisWorkspace({
  model,
}: GithubAnalysisWorkspaceProps) {
  const [draft, setDraft] = useState<GithubConnectionDraft>(model.initialDraft);
  const [connection, setConnection] = useState(model.initialConnection);
  const [analysis, setAnalysis] = useState(model.initialAnalysis);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!model.profileContext) {
      return;
    }

    const stored = readGithubAnalysisStorage(model.profileContext.user.id);
    if (!stored) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setConnection(stored.connection);
      setAnalysis(stored.analysis);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [model.profileContext]);

  const persist = (nextConnection: GithubConnectionRecord | null, nextAnalysis: typeof analysis) => {
    if (!model.profileContext) {
      return;
    }

    writeGithubAnalysisStorage(model.profileContext.user.id, {
      connection: nextConnection,
      analysis: nextAnalysis,
    });
  };

  const handleConnect = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!model.profileContext) {
      setError("GitHub 등록은 로그인한 세션에서만 사용할 수 있습니다.");
      return;
    }

    const profileContext = model.profileContext;

    if (!draft.username.trim() && !draft.profileUrl.trim()) {
      setError("GitHub username 또는 profile URL을 입력해주세요.");
      return;
    }

    if (draft.profileUrl.trim() && !isValidHttpUrl(draft.profileUrl.trim())) {
      setError("GitHub profile URL은 http 또는 https 형식이어야 합니다.");
      return;
    }

    startTransition(async () => {
      const pendingConnection = connection
        ? { ...connection, status: "syncing" as const }
        : null;

      if (pendingConnection) {
        setConnection(pendingConnection);
      }

      await Promise.resolve();

      const nextConnection = buildBranchLocalConnection({
        draft,
        existingConnectedAt: connection?.connectedAt ?? null,
      });
      const nextAnalysis = buildBranchLocalAnalysis({
        connection: nextConnection,
        context: profileContext,
      });

      setConnection(nextConnection);
      setAnalysis(nextAnalysis);
      persist(nextConnection, nextAnalysis);
      setSuccess("GitHub 연결 상태와 branch-local 분석 결과를 갱신했습니다.");
    });
  };

  const handleRefresh = () => {
    if (!model.profileContext || !connection) {
      return;
    }

    const profileContext = model.profileContext;

    setError("");
    setSuccess("");

    startTransition(async () => {
      setConnection({ ...connection, status: "syncing" });
      setAnalysis((current) =>
        current
          ? {
              ...current,
              state: "refreshing",
            }
          : current,
      );

      await Promise.resolve();

      const nextConnection = {
        ...connection,
        status: "connected" as const,
        lastSyncedAt: new Date().toISOString(),
      };
      const nextAnalysis = buildBranchLocalAnalysis({
        connection: nextConnection,
        context: profileContext,
      });

      setConnection(nextConnection);
      setAnalysis(nextAnalysis);
      persist(nextConnection, nextAnalysis);
      setSuccess("분석 결과를 다시 생성했습니다.");
    });
  };

  const handleDisconnect = () => {
    if (!model.profileContext) {
      return;
    }

    setConnection(null);
    setAnalysis(null);
    clearGithubAnalysisStorage(model.profileContext.user.id);
    setSuccess("Branch-local GitHub 연결을 해제했습니다.");
    setError("");
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
            현재 결과는 `feature/p3-ai-platform-contracts` 이전 단계의 branch-local
            adapter 산출물이며, shared provider payload 대신 재사용 가능한 UI 슬롯만
            먼저 고정합니다.
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {model.summaryCards.map((item) => (
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
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getConnectionTone(connection?.status ?? "guest")}`}
              >
                {connection?.status ?? "not_connected"}
              </span>
            </div>

            {model.status === "guest" ? (
              <div className="mt-5 rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                <p className="text-sm leading-7 text-[color:var(--muted)]">
                  로그인 후 GitHub username 또는 profile URL을 등록하고, branch-local
                  분석 결과 UI를 확인할 수 있습니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/login?next=%2Fgithub-analysis" className="button-primary px-4 py-3 text-sm">
                    로그인하고 연결하기
                  </Link>
                  <Link href="/profile" className="button-ghost px-4 py-3 text-sm">
                    프로필 셸 보기
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form className="mt-5 space-y-4" onSubmit={handleConnect}>
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    GitHub username
                    <input
                      value={draft.username}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      className="field"
                      placeholder="campus-link-demo"
                      disabled={isPending}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    GitHub profile URL
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
                      disabled={isPending}
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
                    <button type="submit" className="button-primary px-4 py-3 text-sm" disabled={isPending}>
                      {connection ? "연결 정보 갱신" : "GitHub 등록"}
                    </button>
                    <button
                      type="button"
                      className="button-secondary px-4 py-3 text-sm"
                      onClick={handleRefresh}
                      disabled={isPending || !connection}
                    >
                      분석 다시 생성
                    </button>
                    <button
                      type="button"
                      className="button-ghost px-4 py-3 text-sm"
                      onClick={handleDisconnect}
                      disabled={isPending || !connection}
                    >
                      연결 해제
                    </button>
                  </div>
                </form>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Data Source
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {model.dataSourceLabel}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Last Sync
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatTimestamp(connection?.lastSyncedAt ?? null)}
                    </p>
                  </div>
                </div>
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
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getAnalysisTone(analysis?.state ?? "idle")}`}
              >
                {analysis?.state ?? "idle"}
              </span>
            </div>

            {!analysis ? (
              <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 bg-white/72 p-5 text-sm leading-7 text-[color:var(--muted)]">
                GitHub 연결을 등록하면 coverage, standout stack, focus area, project insight
                카드가 이 영역에 채워집니다.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Coverage
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {analysis.coverageLabel}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Standout Stack
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {analysis.standoutStack}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Collaboration Fit
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {analysis.collaborationFit}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-slate-200/75 bg-white/82 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Generated
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatTimestamp(analysis.generatedAt)}
                    </p>
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
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getAnalysisTone(project.health === "strong" ? "ready" : project.health === "promising" ? "refreshing" : "failed")}`}
                        >
                          {project.health}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                            Role Fit
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {project.roleFit}
                          </p>
                        </div>
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                            Activity Signal
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {project.activity}
                          </p>
                        </div>
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
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                            Highlights
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-7 text-[color:var(--muted)]">
                            {project.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                            Signals
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-7 text-[color:var(--muted)]">
                            {project.signals.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel rounded-[1.8rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Profile Reuse
              </p>
              <div className="mt-4 grid gap-3">
                {model.integrationPoints.profile.map((item) => (
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

            <div className="panel rounded-[1.8rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Admin Reuse
              </p>
              <div className="mt-4 grid gap-3">
                {model.integrationPoints.admin.map((item) => (
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
          </div>
        </div>
      </section>
    </div>
  );
}
