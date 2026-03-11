"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      await fetch("/api/auth-entry/session", {
        method: "DELETE",
      });

      router.push("/");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isPending}
      className="rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? "세션 종료 중..." : "로그아웃"}
    </button>
  );
}
