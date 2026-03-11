"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  getDefaultAuthEntryNextPath,
  type AuthEntryMode,
} from "@/lib/auth-entry/integration-points";
import type {
  ApiError,
  ApiSuccess,
  AuthContextPayload,
  IdentityDataSource,
} from "@/types/identity";

type AuthFormProps = {
  mode: AuthEntryMode;
  nextPath?: string;
  dataSource: IdentityDataSource;
};

const copyByMode = {
  login: {
    eyebrow: "Login Entry",
    title: "기존 계정으로 바로 진입",
    description:
      "Phase 1 A 계약 위에서 세션을 시작하고, 보호 페이지로 자연스럽게 이어집니다.",
    submit: "로그인하고 계속하기",
    endpoint: "/api/auth/login",
    alternateHref: "/signup",
    alternateLabel: "회원가입으로 전환",
  },
  signup: {
    eyebrow: "Signup Entry",
    title: "새 계정을 만들고 시작",
    description:
      "회원가입이 완료되면 세션과 기본 온보딩 상태가 함께 만들어집니다.",
    submit: "회원가입하고 계속하기",
    endpoint: "/api/auth/signup",
    alternateHref: "/login",
    alternateLabel: "로그인으로 전환",
  },
} as const;

export function AuthForm({ mode, nextPath, dataSource }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [campus, setCampus] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const copy = copyByMode[mode];
  const resolvedNextPath = nextPath || getDefaultAuthEntryNextPath(mode);
  const loginEmailPlaceholder =
    mode === "login" && dataSource === "mock"
      ? "student@campus-link.demo"
      : "you@example.com";
  const loginPasswordPlaceholder =
    mode === "login" && dataSource === "mock" ? "jungle1234" : "비밀번호 입력";
  const helperMessage =
    mode === "login"
      ? dataSource === "mock"
        ? "로그인 demo 계정: student@campus-link.demo / jungle1234"
        : "database 모드에서는 먼저 회원가입으로 계정을 만든 뒤 로그인하세요."
      : dataSource === "mock"
        ? "회원가입 없이 빠른 시연이 필요하면 demo 계정으로도 흐름을 확인할 수 있습니다."
        : "회원가입이 완료되면 온보딩 설문으로 이어집니다.";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch(copy.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "signup"
            ? {
                email,
                password,
                displayName,
                campus,
              }
            : {
                email,
                password,
              },
        ),
      });

      const result = (await response.json()) as
        | ApiSuccess<AuthContextPayload>
        | ApiError;

      if (!response.ok || !result.success) {
        setError(
          "error" in result ? result.error.message : "세션 진입에 실패했습니다.",
        );
        return;
      }

      router.push(resolvedNextPath);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="panel-strong rounded-[1.8rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
          {copy.description}
        </p>
        <div className="mt-6 space-y-3">
          {[
            "세션은 Phase 1 A의 campus-link.session cookie를 사용",
            "회원가입 직후 온보딩 상태는 interests step으로 시작",
            "다음 브랜치는 기본 진입 경로만 교체해 연결 가능",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.25rem] border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-[color:var(--muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="panel rounded-[1.8rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Session Entry
        </p>
        <div className="mt-6 space-y-4">
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field"
              placeholder={
                mode === "login"
                  ? loginEmailPlaceholder
                  : "new-user@example.com"
              }
              required
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field"
              placeholder={
                mode === "login" ? loginPasswordPlaceholder : "8자 이상 입력"
              }
              required
            />
          </label>
          {mode === "signup" ? (
            <>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                표시 이름
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="field"
                  placeholder="예: 김정글"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                캠퍼스
                <input
                  value={campus}
                  onChange={(event) => setCampus(event.target.value)}
                  className="field"
                  placeholder="예: Krafton Jungle"
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="mt-5 rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
          {dataSource === "mock" && mode === "login" ? (
            <>
              로그인 demo 계정:{" "}
              <span className="font-semibold text-slate-900">
                student@campus-link.demo / jungle1234
              </span>
            </>
          ) : (
            helperMessage
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "세션 여는 중..." : copy.submit}
        </button>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <Link
            href={`${copy.alternateHref}?next=${encodeURIComponent(resolvedNextPath)}`}
            className="font-semibold text-[color:var(--accent-strong)]"
          >
            {copy.alternateLabel}
          </Link>
          <Link href="/recruit" className="font-semibold text-[color:var(--muted)]">
            둘러보기로 돌아가기
          </Link>
        </div>
      </form>
    </div>
  );
}
