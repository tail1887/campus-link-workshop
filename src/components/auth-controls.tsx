"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearAuthSession,
  getAuthSession,
  subscribeAuthChange,
} from "@/lib/auth/storage";
import type { AuthSession } from "@/types/auth";

export function AuthControls() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const sync = () => {
      setSession(getAuthSession());
    };

    sync();
    return subscribeAuthChange(sync);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="button-secondary px-4 py-3 text-sm">
          로그인
        </Link>
        <Link href="/signup" className="button-primary px-4 py-3 text-sm">
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden rounded-full border border-white/70 bg-white/78 px-4 py-3 text-right md:block">
        <p className="text-sm font-semibold text-slate-950">{session.name}</p>
        <p className="text-xs font-medium text-[color:var(--muted)]">
          {session.campus}
        </p>
      </div>
      <button
        type="button"
        onClick={clearAuthSession}
        className="button-secondary px-4 py-3 text-sm"
      >
        로그아웃
      </button>
    </div>
  );
}
