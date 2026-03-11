"use client";

import { useEffect, useState, useTransition } from "react";
import { addStoredApplication, getStoredApplications } from "@/lib/storage";
import type { RecruitApplication, RecruitPost } from "@/types/recruit";

type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
} | null;

type ApplyPanelProps = {
  post: RecruitPost;
  currentUser: CurrentUser;
};

export function ApplyPanel({ post, currentUser }: ApplyPanelProps) {
  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [contact, setContact] = useState(currentUser?.email ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appliedCount, setAppliedCount] = useState(() =>
    getStoredApplications().filter((item) => item.postSlug === post.slug).length,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sync = () => {
      setAppliedCount(
        getStoredApplications().filter((item) => item.postSlug === post.slug)
          .length,
      );
    };

    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [post.slug]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError("이름, 연락처, 메시지를 모두 입력해주세요.");
      return;
    }

    const duplicate = getStoredApplications().find(
      (item) =>
        item.postSlug === post.slug &&
        item.contact.trim().toLowerCase() === contact.trim().toLowerCase(),
    );

    if (duplicate) {
      setError("이미 같은 연락처로 지원한 기록이 있습니다.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/posts/${post.slug}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          contact,
          message,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          applicationId: string;
          message: string;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error?.message ?? "지원 처리 중 문제가 발생했습니다.");
        return;
      }

      const application: RecruitApplication = {
        id: payload.data.applicationId,
        postSlug: post.slug,
        applicantId: currentUser?.id ?? null,
        name: name.trim(),
        contact: contact.trim(),
        message: message.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      addStoredApplication(application);
      setAppliedCount((count) => count + 1);
      setSuccess(payload.data.message);
      setName(currentUser?.displayName ?? "");
      setContact(currentUser?.email ?? "");
      setMessage("");
    });
  };

  return (
    <div className="panel-strong rounded-[1.8rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Apply Flow
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            이 팀에 지원하기
          </h3>
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
          현재 {appliedCount}건
        </div>
      </div>

      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        기본값은 브라우저 fallback 저장으로 동작합니다. PostgreSQL 모드로
        전환하면 서버 저장과 중복 지원 방지 흐름을 함께 검증할 수 있습니다.
      </p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field"
          placeholder="이름 또는 닉네임"
        />
        <input
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          className="field"
          placeholder="이메일 또는 오픈채팅 링크"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="field textarea"
          placeholder="간단한 자기소개와 지원 동기를 입력해 주세요"
        />
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
          {isPending ? "지원 접수 중..." : "지원하기 보내기"}
        </button>
      </form>
    </div>
  );
}
