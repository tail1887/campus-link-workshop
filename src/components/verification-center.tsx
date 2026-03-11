"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import {
  getVerificationBadgeLabel,
  getVerificationMethodLabel,
  getVerificationStatusLabel,
  getVerificationUiState,
} from "@/lib/verification-ui";
import type {
  SubmitVerificationRequest,
  Verification,
  VerificationMethod,
  VerificationPayload,
} from "@/types/profile";

type VerificationCenterProps = {
  authUser: {
    id: string;
    email: string;
  } | null;
  initialVerification: Verification | null;
};

const methodOptions: Array<{
  value: VerificationMethod;
  label: string;
  description: string;
}> = [
  {
    value: "campus_email",
    label: "학교 이메일",
    description: "학교 메일 주소로 소속을 확인하는 기본 제출 방식",
  },
  {
    value: "student_card",
    label: "학생증",
    description: "학생증 또는 재학 증빙 링크를 제출하는 방식",
  },
  {
    value: "manual_review",
    label: "수동 검토",
    description: "운영 검토용 메모와 링크를 함께 남기는 방식",
  },
];

function buildInitialDraft(
  verification: Verification | null,
): SubmitVerificationRequest {
  return {
    method: verification?.method ?? "campus_email",
    evidenceLabel: verification?.evidenceLabel ?? "",
    evidenceUrl: verification?.evidenceUrl ?? "",
    note: verification?.note ?? "",
  };
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function VerificationCenter({
  authUser,
  initialVerification,
}: VerificationCenterProps) {
  const [verification, setVerification] = useState(initialVerification);
  const [draft, setDraft] = useState(() => buildInitialDraft(initialVerification));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const uiState = getVerificationUiState(verification);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!authUser) {
      setError("인증 요청은 로그인한 학생 세션에서만 제출할 수 있습니다.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: draft.method,
          evidenceLabel: draft.evidenceLabel?.trim() || null,
          evidenceUrl: draft.evidenceUrl?.trim() || null,
          note: draft.note?.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: VerificationPayload }
        | { success: false; error?: { message?: string } }
        | null;

      if (!response.ok || !payload) {
        setError("인증 요청 제출에 실패했습니다.");
        return;
      }

      if (!payload.success) {
        setError(payload.error?.message ?? "인증 요청 제출에 실패했습니다.");
        return;
      }

      setVerification(payload.data.verification);
      setDraft(buildInitialDraft(payload.data.verification));
      setSuccess("인증 요청이 접수되었습니다. 현재 상태는 검토 중으로 변경되었습니다.");
    });
  };

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong mesh rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">{uiState.eyebrow}</span>
            <h1 className="section-title text-slate-950">추가 인증과 배지 상태</h1>
            <p className="section-subtitle">{uiState.description}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/82 px-5 py-4 text-sm leading-7 text-[color:var(--muted)]">
            프로필, 후속 admin 검수 큐, 그리고 배지 노출 컴포넌트가 모두 같은
            `Verification` 계약을 재사용합니다.
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              현재 상태
            </p>
            <div className="mt-3">
              <VerificationStatusBadge
                label={uiState.badgeLabel}
                tone={uiState.badgeTone}
              />
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              배지 표시
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {verification ? getVerificationBadgeLabel(verification.badge) : "Preview"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              제출 방식
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {verification ? getVerificationMethodLabel(verification.method) : "로그인 후 확인"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              마지막 제출
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {verification ? formatDateTime(verification.submittedAt) : "없음"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Verification Request
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                인증 요청 제출
              </h2>
            </div>
            <VerificationStatusBadge
              label={verification ? getVerificationStatusLabel(verification.status) : "로그인 필요"}
              tone={uiState.badgeTone}
            />
          </div>

          {!authUser ? (
            <div className="mt-5 rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                인증 제출은 로그인 후 활성화됩니다. 현재 화면은 상태 UI와 배지 노출
                구조를 확인하는 미리보기입니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/login" className="button-primary px-4 py-3 text-sm">
                  로그인하기
                </Link>
                <Link href="/profile" className="button-ghost px-4 py-3 text-sm">
                  프로필 셸 보기
                </Link>
              </div>
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              인증 방식
              <select
                value={draft.method}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    method: event.target.value as VerificationMethod,
                  }))
                }
                className="field"
                disabled={!uiState.actionEnabled || isPending || !authUser}
              >
                {methodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="block text-xs font-medium text-[color:var(--muted)]">
                {
                  methodOptions.find((option) => option.value === draft.method)
                    ?.description
                }
              </span>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              증빙 이름
              <input
                value={draft.evidenceLabel ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    evidenceLabel: event.target.value,
                  }))
                }
                className="field"
                placeholder="예: 학생증 앞면, 학교 이메일 캡처"
                disabled={!uiState.actionEnabled || isPending || !authUser}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              증빙 링크
              <input
                value={draft.evidenceUrl ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    evidenceUrl: event.target.value,
                  }))
                }
                className="field"
                placeholder="https://example.com/verification-proof"
                disabled={!uiState.actionEnabled || isPending || !authUser}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              제출 메모
              <textarea
                value={draft.note ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                className="field textarea"
                placeholder="운영 검토 시 확인해주길 원하는 내용을 남겨주세요."
                disabled={!uiState.actionEnabled || isPending || !authUser}
              />
            </label>

            {verification?.status === "rejected" && verification.rejectionReason ? (
              <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                반려 사유: {verification.rejectionReason}
              </div>
            ) : null}
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
              className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!uiState.actionEnabled || isPending || !authUser}
            >
              {isPending ? "제출 중..." : uiState.actionLabel}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Current Contract Snapshot
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-950">상태</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {verification ? getVerificationStatusLabel(verification.status) : "로그인 필요"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-950">배지 enum</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {verification ? verification.badge : "none"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-950">검토 완료 시각</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {verification ? formatDateTime(verification.reviewedAt) : "없음"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-950">인증 완료 시각</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {verification ? formatDateTime(verification.verifiedAt) : "없음"}
                </p>
              </div>
            </div>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Downstream Integration
            </p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                프로필 셸은 `verification.badge`와 `verification.status`만 읽어 상단
                요약과 진입 카드 상태를 표시합니다.
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                관리자 후속 브랜치는 같은 계약에서 `pending` 상태 목록과 검토 액션만
                확장하면 됩니다.
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
                재제출 UX는 <code>rejected -&gt; pending</code> 전환을 그대로 따르며
                별도 enum을 만들지 않습니다.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
