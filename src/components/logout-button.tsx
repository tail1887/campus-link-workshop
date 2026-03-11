"use client";

import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      });

      window.location.assign("/");
    });
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isPending}
      className="button-ghost px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? "세션 종료 중..." : "로그아웃"}
    </button>
  );
}
