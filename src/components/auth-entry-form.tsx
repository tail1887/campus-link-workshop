"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AuthEntryMode } from "@/lib/auth-entry/branch-auth-entry-adapter";

type AuthEntryFormProps = {
  mode: AuthEntryMode;
  nextPath: string;
};

const modeCopy = {
  login: {
    eyebrow: "Login Entry",
    title: "기존 계정으로 바로 진입",
    description:
      "Phase 1 A 계약 전까지는 branch-local 세션 어댑터로 진입 상태만 유지합니다.",
    submit: "로그인하고 계속하기",
    alternateHref: "/signup",
    alternateLabel: "회원가입으로 전환",
  },
  signup: {
    eyebrow: "Signup Entry",
    title: "새 계정 진입 흐름 만들기",
    description:
      "회원가입 세션을 먼저 열고, 설문과 기본 프로필은 이후 트랙이 연결할 수 있게 분리합니다.",
    submit: "회원가입하고 계속하기",
    alternateHref: "/login",
    alternateLabel: "로그인으로 전환",
  },
} as const;

export function AuthEntryForm({ mode, nextPath }: AuthEntryFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const copy = modeCopy[mode];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/auth-entry/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          email,
          displayName,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: {
          nextPath: string;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !result.success || !result.data) {
        setError(result.error?.message ?? "세션 진입에 실패했습니다.");
        return;
      }

      router.push(nextPath || result.data.nextPath);
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
            "최종 User/Session 계약 대신 branch-local 쿠키 세션 사용",
            "보호 페이지 진입 UX만 먼저 고정",
            "설문과 프로필은 이후 브랜치에서 연결",
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
              placeholder="example@campus-link.dev"
              required
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            표시 이름
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="field"
              placeholder="예: 정글 팀장"
            />
          </label>
        </div>

        <div className="mt-5 rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
          보호 페이지 진입 후 목적지는 <span className="font-semibold text-slate-900">{nextPath}</span>
          입니다.
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
            href={`${copy.alternateHref}?next=${encodeURIComponent(nextPath)}`}
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
