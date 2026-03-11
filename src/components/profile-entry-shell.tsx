"use client";

import Link from "next/link";
import { getAuthSession } from "@/lib/auth/storage";

export function ProfileEntryShell() {
  const session = getAuthSession();

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="space-y-4">
          <span className="eyebrow">Phase 1 D Track</span>
          <h1 className="section-title text-slate-950">
            역할별 프로필 진입 구조
          </h1>
          <p className="section-subtitle">
            이 페이지는 A 트랙 계약이 아직 고정되지 않은 상태에서, 사용자 셸과
            관리자 셸로 들어가는 구조만 branch-local adapter 기준으로 먼저
            제공합니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Session
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {session ? "로그인됨" : "게스트"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Current ID
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {session?.loginId ?? "없음"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Contract Source
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              branch-local adapter
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Link href="/profile" className="panel rounded-[1.8rem] p-6">
          <span className="eyebrow">User Entry</span>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">
            사용자 기본 프로필 셸
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            자기소개, 관심 키워드, 인증, 이력서 모듈이 들어올 사용자용 기본
            셸입니다.
          </p>
        </Link>

        <Link href="/admin/profile" className="panel rounded-[1.8rem] p-6">
          <span className="eyebrow">Admin Entry</span>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">
            관리자 기본 프로필 셸
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            관리자 역할 표시, 운영 진입점, 콘텐츠 검수 도구가 들어올 관리자용
            기본 셸입니다.
          </p>
        </Link>
      </section>
    </div>
  );
}
