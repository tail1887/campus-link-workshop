"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  beginOnboardingSurvey,
  goToStep,
  loadSurveySnapshotForEntry,
  resetSurveySnapshot,
  saveAccountDraft,
  saveInterestKeywords,
  saveProfileDraft,
  type SurveyAccountDraft,
  type SurveyEntry,
  type SurveyOnboardingStep,
  type SurveyProfileDraft,
  type SurveySnapshot,
} from "@/lib/onboarding-survey-adapter";

const suggestedKeywords = [
  "frontend",
  "backend",
  "design",
  "ios",
  "android",
  "ai",
  "data",
  "hackathon",
  "study",
  "startup",
  "pm",
  "marketing",
];

const stepMeta: Array<{
  step: SurveyOnboardingStep;
  label: string;
  title: string;
}> = [
  { step: "account", label: "1단계", title: "계정 확인" },
  { step: "interests", label: "2단계", title: "관심사 선택" },
  { step: "profile", label: "3단계", title: "프로필 작성" },
  { step: "complete", label: "완료", title: "설정 완료" },
];

type OnboardingSurveyProps = {
  entry: SurveyEntry;
};

export function OnboardingSurvey({ entry }: OnboardingSurveyProps) {
  const [snapshot, setSnapshot] = useState<SurveySnapshot | null>(() =>
    loadSurveySnapshotForEntry(entry),
  );
  const [customKeyword, setCustomKeyword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => setSnapshot(loadSurveySnapshotForEntry(entry));

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [entry]);

  if (!snapshot) {
    return null;
  }

  const selectedKeywords = snapshot.onboarding.interestKeywords;
  const currentStep = snapshot.onboarding.currentStep;
  const progressIndex = stepMeta.findIndex((item) => item.step === currentStep);
  const availableKeywords = [...new Set([...suggestedKeywords, ...selectedKeywords])];

  const updateAccount = <K extends keyof SurveyAccountDraft>(
    key: K,
    value: SurveyAccountDraft[K],
  ) => {
    setSnapshot((current) =>
      current
        ? {
            ...current,
            account: {
              ...current.account,
              [key]: value,
            },
          }
        : current,
    );
  };

  const updateProfile = <K extends keyof SurveyProfileDraft>(
    key: K,
    value: SurveyProfileDraft[K],
  ) => {
    setSnapshot((current) =>
      current
        ? {
            ...current,
            profile: {
              ...current.profile,
              [key]: value,
            },
          }
        : current,
    );
  };

  const handleAccountContinue = () => {
    if (
      !snapshot.account.email.trim() ||
      !snapshot.account.password.trim() ||
      !snapshot.account.displayName.trim()
    ) {
      setError("이메일, 비밀번호, 표시 이름은 필수입니다.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snapshot.account.email.trim())) {
      setError("올바른 이메일 형식으로 입력해 주세요.");
      return;
    }

    if (snapshot.account.password.trim().length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setSnapshot(
      saveAccountDraft({
        ...snapshot.account,
        email: snapshot.account.email.trim(),
        password: snapshot.account.password.trim(),
        displayName: snapshot.account.displayName.trim(),
        campus: snapshot.account.campus.trim(),
      }),
    );
    setError("");
  };

  const toggleKeyword = (keyword: string) => {
    const nextKeywords = selectedKeywords.includes(keyword)
      ? selectedKeywords.filter((item) => item !== keyword)
      : [...selectedKeywords, keyword];

    setSnapshot((current) =>
      current
        ? {
            ...current,
            onboarding: {
              ...current.onboarding,
              interestKeywords: nextKeywords,
            },
          }
        : current,
    );
  };

  const addCustomKeyword = () => {
    const nextKeyword = customKeyword.trim().toLowerCase();
    if (!nextKeyword) {
      return;
    }

    if (!selectedKeywords.includes(nextKeyword)) {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              onboarding: {
                ...current.onboarding,
                interestKeywords: [...current.onboarding.interestKeywords, nextKeyword],
              },
            }
          : current,
      );
    }

    setCustomKeyword("");
  };

  const handleInterestContinue = () => {
    if (selectedKeywords.length < 2) {
      setError("관심 키워드는 두 개 이상 선택해 주세요.");
      return;
    }

    setSnapshot(saveInterestKeywords(selectedKeywords));
    setError("");
  };

  const handleProfileComplete = () => {
    if (!snapshot.profile.intro.trim()) {
      setError("온보딩을 마치기 전에 한 줄 소개를 입력해 주세요.");
      return;
    }

    setSnapshot(
      saveProfileDraft({
        intro: snapshot.profile.intro.trim(),
        collaborationStyle: snapshot.profile.collaborationStyle.trim(),
        weeklyHours: snapshot.profile.weeklyHours.trim(),
      }),
    );
    setError("");
  };

  const handleStepJump = (step: SurveyOnboardingStep) => {
    if (step === "complete" && snapshot.onboarding.status !== "completed") {
      return;
    }

    setSnapshot(goToStep(step));
    setError("");
  };

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="mesh panel-strong overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <span className="eyebrow">
              {entry === "signup" ? "1단계 회원가입" : "1단계 온보딩"}
            </span>
            <h1 className="section-title text-slate-950">
              빠르게 시작하고,
              <br />
              내 취향에 맞게 다듬어 보세요.
            </h1>
            <p className="section-subtitle">
              이 흐름은 1단계 온보딩 계약을 기준으로 구성되어 있습니다.
              회원가입 뒤에는 관심사와 프로필 설정부터 자연스럽게 이어지고,
              계정 단계는 identity 계약 브랜치가 합쳐질 때까지 가볍게 확인만 할 수 있도록 남겨두었습니다.
            </p>
            <div className="info-grid">
              {[
                "회원가입 뒤에는 같은 내용을 다시 묻지 않고 바로 온보딩으로 이어집니다.",
                "계정 정보는 임시 로컬 확인 단계로만 유지됩니다.",
                "선택한 키워드는 onboarding.interestKeywords와 연결됩니다.",
                "완료 시 로컬 온보딩 상태가 completed로 바뀝니다.",
                "프로필 답변은 의도적으로 브랜치 로컬 상태에만 저장됩니다.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-white/65 bg-white/78 p-4 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  진행 상태
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {snapshot.onboarding.status === "completed"
                    ? "온보딩이 완료되었습니다"
                    : "설정을 진행하고 있어요"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSnapshot(resetSurveySnapshot());
                  setError("");
                }}
                className="button-secondary px-4 py-3 text-sm"
              >
                처음부터 다시 하기
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {stepMeta.map((item, index) => {
                const active = currentStep === item.step;
                const complete =
                  item.step === "complete"
                    ? snapshot.onboarding.status === "completed"
                    : index < progressIndex;

                return (
                  <button
                    type="button"
                    key={item.step}
                    onClick={() => handleStepJump(item.step)}
                    className={`flex items-center justify-between rounded-[1.35rem] border px-4 py-3 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(16,35,58,0.12)] ${
                      active
                        ? "border-slate-900 bg-slate-950 text-white hover:bg-slate-900"
                        : "border-white/65 bg-white/78 text-slate-900 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                          active ? "text-white/70" : "text-[color:var(--muted)]"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{item.title}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        complete
                          ? active
                            ? "bg-white/16 text-white"
                            : "bg-emerald-50 text-emerald-700"
                          : active
                            ? "bg-white/16 text-white"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {complete ? "완료" : active ? "진행 중" : "대기"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[1.8rem] p-5 sm:p-6">
          {currentStep === "account" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                1단계
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                계정 정보를 확인해 주세요
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                이 단계는 1단계 계약 연결을 위한 가벼운 확인 화면입니다.
                회원가입을 마치고 들어왔다면 바로 관심사 선택으로 넘어가도 됩니다.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-800 md:col-span-2">
                  학교 이메일
                  <input
                    className="field"
                    value={snapshot.account.email}
                    onChange={(event) => updateAccount("email", event.target.value)}
                    placeholder="you@campus.ac.kr"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  비밀번호
                  <input
                    type="password"
                    className="field"
                    value={snapshot.account.password}
                    onChange={(event) =>
                      updateAccount("password", event.target.value)
                    }
                    placeholder="8자 이상 입력해 주세요"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  표시 이름
                  <input
                    className="field"
                    value={snapshot.account.displayName}
                    onChange={(event) =>
                      updateAccount("displayName", event.target.value)
                    }
                    placeholder="팀원에게 보이는 이름"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800 md:col-span-2">
                  캠퍼스
                  <input
                    className="field"
                    value={snapshot.account.campus}
                    onChange={(event) => updateAccount("campus", event.target.value)}
                    placeholder="identity 계약 머지 전까지는 선택 입력"
                  />
                </label>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAccountContinue}
                  className="button-primary"
                >
                  저장하고 계속하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(beginOnboardingSurvey());
                    setError("");
                  }}
                  className="button-secondary"
                >
                  관심사 선택으로 건너뛰기
                </button>
              </div>
            </>
          ) : null}

          {currentStep === "interests" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                2단계
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                관심 키워드를 골라 주세요
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                여기서 고른 항목은 1단계 `interestKeywords` 계약에 맞춰
                adapter에서 정리되어 저장됩니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {availableKeywords.map((keyword) => {
                  const active = selectedKeywords.includes(keyword);

                  return (
                    <button
                      type="button"
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      className={`rounded-full px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(16,35,58,0.12)] ${
                        active
                          ? "bg-slate-950 text-white hover:bg-slate-900"
                          : "border border-slate-200/80 bg-white/84 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      #{keyword}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  className="field"
                  value={customKeyword}
                  onChange={(event) => setCustomKeyword(event.target.value)}
                  placeholder="직접 키워드 추가"
                />
                <button
                  type="button"
                  onClick={addCustomKeyword}
                  className="button-secondary"
                >
                  키워드 추가
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(goToStep("account"));
                    setError("");
                  }}
                  className="button-secondary"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleInterestContinue}
                  className="button-primary"
                >
                  프로필 단계로 계속하기
                </button>
              </div>
            </>
          ) : null}

          {currentStep === "profile" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                3단계
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                프로필 설정을 마무리해 주세요
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                이 입력값은 프로필 계약이 확정되기 전까지 브랜치 로컬에서만 사용하는
                임시 항목입니다.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  한 줄 소개
                  <textarea
                    className="field textarea"
                    value={snapshot.profile.intro}
                    onChange={(event) => updateProfile("intro", event.target.value)}
                    placeholder="어떤 팀원인지 짧게 소개해 주세요"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    협업 스타일
                    <select
                      className="field"
                      value={snapshot.profile.collaborationStyle}
                      onChange={(event) =>
                        updateProfile("collaborationStyle", event.target.value)
                      }
                    >
                      <option value="">하나를 선택해 주세요</option>
                      <option value="async-first">비동기 중심</option>
                      <option value="hybrid">하이브리드</option>
                      <option value="live-sprint">실시간 스프린트</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    주간 가능 시간
                    <select
                      className="field"
                      value={snapshot.profile.weeklyHours}
                      onChange={(event) =>
                        updateProfile("weeklyHours", event.target.value)
                      }
                    >
                      <option value="">하나를 선택해 주세요</option>
                      <option value="under-3">3시간 미만</option>
                      <option value="3-6">3시간에서 6시간</option>
                      <option value="6-10">6시간에서 10시간</option>
                      <option value="10-plus">10시간 이상</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(goToStep("interests"));
                    setError("");
                  }}
                  className="button-secondary"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleProfileComplete}
                  className="button-primary"
                >
                  온보딩 완료하기
                </button>
              </div>
            </>
          ) : null}

          {currentStep === "complete" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                완료
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                온보딩이 완료되었습니다
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                로컬 adapter가 `status=completed`와 `currentStep=complete`를
                반영해 1단계 계약 흐름과 같은 형태로 마무리했습니다.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/65 bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    표시 이름
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {snapshot.account.displayName || "미입력"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/65 bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    완료 시각
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {snapshot.onboarding.completedAt ?? "아직 완료되지 않았습니다"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.4rem] border border-white/65 bg-white/82 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  선택한 키워드
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {snapshot.onboarding.interestKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(goToStep("profile"));
                    setError("");
                  }}
                  className="button-secondary"
                >
                  프로필 단계 다시 보기
                </button>
                <Link href="/" className="button-secondary">
                  둘러보기
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(resetSurveySnapshot());
                    setError("");
                  }}
                  className="button-primary"
                >
                  처음부터 다시 시작
                </button>
              </div>
            </>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              계약 연결 포인트
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              계약 브랜치 머지 후 교체될 부분
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                계정 단계는 로컬 저장 대신 `POST /api/auth/signup` 호출로 바뀝니다.
              </li>
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                이어하기 흐름은 localStorage 대신 `GET /api/onboarding/state`를 읽게 됩니다.
              </li>
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                관심사 업데이트는 `interestKeywords`, `currentStep`를 담아
                `PUT /api/onboarding/state`로 연결됩니다.
              </li>
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                임시 프로필 입력 필드는 프로필 계약 브랜치에서 공용 shape가 정해질 때까지
                브랜치 로컬로 유지됩니다.
              </li>
            </ul>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              바로가기
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/" className="button-secondary">
                홈으로 돌아가기
              </Link>
              <Link href="/signup" className="button-secondary">
                회원가입으로 돌아가기
              </Link>
              <Link href="/onboarding" className="button-secondary">
                온보딩 이어하기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
