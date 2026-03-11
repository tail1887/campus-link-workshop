"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  BranchLocalAlertToggle,
  BranchLocalCommunicationThread,
  CommunicationCenterViewModel,
} from "@/lib/communication-center/adapter";
import {
  createBranchLocalInquiry,
  getBranchLocalCommunicationState,
  saveBranchLocalAlertPreferences,
} from "@/lib/communication-center/storage";

type CommunicationCenterProps = {
  model: CommunicationCenterViewModel;
};

type InquiryDraft = {
  title: string;
  categoryLabel: string;
  preferredReplyChannel: string;
  message: string;
};

const inquiryCategories = ["계정 문의", "지원 상태", "프로필 피드백", "기타 요청"];

const initialDraft = (replyChannel: string): InquiryDraft => ({
  title: "",
  categoryLabel: inquiryCategories[0],
  preferredReplyChannel: replyChannel,
  message: "",
});

function formatTimeline(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CommunicationCenter({ model }: CommunicationCenterProps) {
  const authUser = model.authUser;
  const [threads, setThreads] = useState<BranchLocalCommunicationThread[]>(
    model.seededThreads,
  );
  const [toggles, setToggles] = useState<BranchLocalAlertToggle[]>(
    model.seededAlertToggles,
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");
  const [draft, setDraft] = useState(() =>
    initialDraft(model.authUser?.email ?? ""),
  );
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [settingsNotice, setSettingsNotice] = useState("");

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const sync = () => {
      const state = getBranchLocalCommunicationState({
        userId: authUser.id,
        seededThreads: model.seededThreads,
        seededAlertToggles: model.seededAlertToggles,
      });

      setThreads(state.threads);
      setToggles(state.toggles);
      setQuietHoursEnabled(state.quietHoursEnabled);
      setQuietHoursStart(state.quietHoursStart);
      setQuietHoursEnd(state.quietHoursEnd);
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [authUser, model.seededAlertToggles, model.seededThreads]);

  const updateToggle = (toggleId: string) => {
    setSettingsNotice("");
    setToggles((current) =>
      current.map((item) =>
        item.id === toggleId ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const saveSettings = () => {
    if (!authUser) {
      setSettingsNotice("로그인 후 알림 설정을 저장할 수 있습니다.");
      return;
    }

    saveBranchLocalAlertPreferences({
      userId: authUser.id,
      toggles,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    });
    setSettingsNotice("알림 설정을 브라우저 임시 저장소에 반영했습니다.");
  };

  const submitInquiry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!authUser) {
      setFormError("문의 제출은 로그인 후 사용할 수 있습니다.");
      return;
    }

    const result = createBranchLocalInquiry({
      userId: authUser.id,
      title: draft.title,
      categoryLabel: draft.categoryLabel,
      preferredReplyChannel: draft.preferredReplyChannel,
      message: draft.message,
    });

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setThreads((current) =>
      [result.thread, ...current].sort((left, right) =>
        right.lastUpdateAt.localeCompare(left.lastUpdateAt),
      ),
    );
    setDraft(initialDraft(authUser.email));
    setFormSuccess(
      "문의가 접수되었습니다. 현재 브랜치에서는 communication center 타임라인에서 바로 확인할 수 있습니다.",
    );
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
            {model.highlights[0]}
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

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Inquiry Flow
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  문의 보내기
                </h2>
              </div>
              <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)]">
                branch-local draft
              </div>
            </div>

            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              Phase 2 A 계약이 머지되기 전까지는 문의 payload를 localStorage에만 보관합니다.
              운영 inbox나 실제 알림 전송은 아직 연결하지 않습니다.
            </p>

            {!authUser ? (
              <div className="mt-4 rounded-[1.4rem] border border-slate-200/75 bg-white/82 p-4">
                <p className="text-sm leading-7 text-[color:var(--muted)]">
                  현재는 미리보기 상태입니다. 실제 제출 흐름은 학생 세션에서만 활성화됩니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/login" className="button-primary px-4 py-3 text-sm">
                    로그인하기
                  </Link>
                  <Link href="/entry" className="button-ghost px-4 py-3 text-sm">
                    프로필 진입 보기
                  </Link>
                </div>
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={submitInquiry}>
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                문의 제목
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  className="field"
                  placeholder="예: 프로필 공개 범위를 확인하고 싶어요"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  문의 유형
                  <select
                    value={draft.categoryLabel}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        categoryLabel: event.target.value,
                      }))
                    }
                    className="field"
                  >
                    {inquiryCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  답변 채널
                  <input
                    value={draft.preferredReplyChannel}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        preferredReplyChannel: event.target.value,
                      }))
                    }
                    className="field"
                    placeholder="이메일 또는 선호 채널"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-semibold text-slate-800">
                문의 내용
                <textarea
                  value={draft.message}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, message: event.target.value }))
                  }
                  className="field textarea"
                  placeholder="필요한 도움이나 확인하고 싶은 상황을 적어주세요"
                />
              </label>

              {formError ? (
                <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {formError}
                </div>
              ) : null}
              {formSuccess ? (
                <div className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {formSuccess}
                </div>
              ) : null}

              <button type="submit" className="button-primary w-full">
                문의 제출하기
              </button>
            </form>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Communication Log
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  최근 커뮤니케이션
                </h2>
              </div>
              <div className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-2 text-xs font-semibold text-slate-700">
                {threads.length}건
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {threads.map((thread) => (
                <article
                  key={thread.id}
                  className="rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {thread.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        {thread.categoryLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-[color:var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--teal)]">
                      {thread.statusLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {thread.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-[color:var(--muted)]">
                    <span>생성 {formatTimeline(thread.createdAt)}</span>
                    <span>업데이트 {formatTimeline(thread.lastUpdateAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Alert Settings
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              내 알림 설정
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              사용자 제어면만 먼저 구현하고, 실제 notification event 계약과 발송 로직은
              Phase 4에서 붙일 수 있도록 느슨하게 유지합니다.
            </p>

            <div className="mt-5 space-y-3">
              {toggles.map((toggle) => (
                <button
                  key={toggle.id}
                  type="button"
                  onClick={() => updateToggle(toggle.id)}
                  className="flex w-full items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200/75 bg-white/80 px-4 py-4 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {toggle.label}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                      {toggle.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      toggle.enabled
                        ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {toggle.enabled ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-slate-200/75 bg-white/80 p-4">
              <label className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-800">
                <span>조용한 시간 사용</span>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(event) => setQuietHoursEnabled(event.target.checked)}
                  className="h-4 w-4 accent-[color:var(--accent)]"
                />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  시작 시각
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(event) => setQuietHoursStart(event.target.value)}
                    className="field"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  종료 시각
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(event) => setQuietHoursEnd(event.target.value)}
                    className="field"
                  />
                </label>
              </div>
            </div>

            {settingsNotice ? (
              <div className="mt-4 rounded-[1.25rem] bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                {settingsNotice}
              </div>
            ) : null}

            <button type="button" onClick={saveSettings} className="button-secondary mt-5 w-full">
              알림 설정 저장하기
            </button>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Integration Notes
            </p>
            <div className="mt-4 grid gap-3">
              {model.highlights.slice(1).concat(model.notes).map((note) => (
                <div
                  key={note}
                  className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
