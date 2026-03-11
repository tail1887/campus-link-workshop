"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  isCampusEmail,
  registerMockUser,
  signInMockUser,
} from "@/lib/auth/storage";

type AuthFormProps = {
  mode: "login" | "signup";
};

const demoSignup = {
  name: "김캠퍼스",
  email: "demo@campus.ac.kr",
  campus: "서울 캠퍼스",
  password: "campus1234",
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [campus, setCampus] = useState("서울 캠퍼스");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const isSignup = mode === "signup";

  const fillDemo = () => {
    setName(demoSignup.name);
    setEmail(demoSignup.email);
    setCampus(demoSignup.campus);
    setPassword(demoSignup.password);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      setError("필수 입력값을 모두 채워주세요.");
      return;
    }

    if (!isCampusEmail(email)) {
      setError("학교 이메일(.ac.kr)로 가입하거나 로그인해 주세요.");
      return;
    }

    if (password.trim().length < 8) {
      setError("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }

    startTransition(() => {
      if (isSignup) {
        const result = registerMockUser({
          name: name.trim(),
          email,
          campus,
          password,
        });

        if (!result.ok) {
          setError(result.message);
          return;
        }

        setSuccess("회원가입이 완료되었습니다. 바로 로그인 상태로 전환합니다.");
        router.push("/");
        router.refresh();
        return;
      }

      const result = signInMockUser({
        email,
        password,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess("로그인이 완료되었습니다.");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="panel rounded-[1.8rem] p-6">
        <span className="eyebrow">
          {isSignup ? "Signup Flow" : "Login Flow"}
        </span>
        <h1 className="section-title mt-5 text-slate-950">
          {isSignup ? "학교 이메일로 가입하고" : "바로 로그인해서"}
          <br />
          {isSignup ? "팀 탐색 흐름을 시작하세요." : "팀 탐색 흐름을 이어가세요."}
        </h1>
        <p className="section-subtitle mt-4">
          현재는 브라우저 localStorage 기반 mock 인증입니다. 팀이 실제 세션,
          학교 인증, 보호 라우트를 붙이기 전에 화면과 사용자 흐름을 먼저
          맞추기 위한 기반입니다.
        </p>

        <div className="info-grid mt-6">
          {[
            isSignup
              ? "가입 즉시 로그인 상태로 전환됩니다."
              : "가입한 학교 이메일과 비밀번호로 로그인할 수 있습니다.",
            "데이터는 현재 브라우저에만 저장됩니다.",
            "`.ac.kr` 형식 이메일만 허용해 캠퍼스 흐름을 먼저 맞춥니다.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.35rem] border border-white/70 bg-white/74 p-4 text-sm leading-7 text-[color:var(--muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="panel-strong rounded-[1.8rem] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {isSignup ? "Create Account" : "Sign In"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {isSignup ? "회원가입" : "로그인"}
            </h2>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="rounded-full border border-slate-200/80 bg-white/84 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            데모 입력
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {isSignup ? (
            <>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                이름
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field"
                  placeholder="예: 김캠퍼스"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                활동 캠퍼스
                <input
                  value={campus}
                  onChange={(event) => setCampus(event.target.value)}
                  className="field"
                  placeholder="예: 서울 캠퍼스"
                />
              </label>
            </>
          ) : null}

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            학교 이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field"
              placeholder="예: me@campus.ac.kr"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field"
              placeholder="8자 이상 입력"
            />
          </label>

          {error ? (
            <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending
              ? isSignup
                ? "가입 처리 중..."
                : "로그인 처리 중..."
              : isSignup
                ? "회원가입하고 시작하기"
                : "로그인하고 계속하기"}
          </button>

          <p className="text-center text-sm text-[color:var(--muted)]">
            {isSignup ? "이미 계정이 있나요?" : "아직 계정이 없나요?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-[color:var(--accent-strong)]"
            >
              {isSignup ? "로그인하기" : "회원가입하기"}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
