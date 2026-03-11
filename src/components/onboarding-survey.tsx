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
  { step: "account", label: "Step 01", title: "Account Ready" },
  { step: "interests", label: "Step 02", title: "Interests" },
  { step: "profile", label: "Step 03", title: "Profile" },
  { step: "complete", label: "Done", title: "Complete" },
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
      setError("Email, password, and display name are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snapshot.account.email.trim())) {
      setError("Enter a valid email format for the signup step.");
      return;
    }

    if (snapshot.account.password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
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
      setError("Choose at least two keywords for the survey.");
      return;
    }

    setSnapshot(saveInterestKeywords(selectedKeywords));
    setError("");
  };

  const handleProfileComplete = () => {
    if (!snapshot.profile.intro.trim()) {
      setError("Add a short intro before finishing onboarding.");
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
              {entry === "signup" ? "Phase 1 Signup" : "Phase 1 Onboarding"}
            </span>
            <h1 className="section-title text-slate-950">
              Join faster,
              <br />
              then tune your fit.
            </h1>
            <p className="section-subtitle">
              This flow follows the Phase 1 onboarding contract. After signup,
              onboarding starts from interests and profile setup, while the
              account step stays available as a lightweight confirmation shell
              until the identity contract branch merges.
            </p>
            <div className="info-grid">
              {[
                "Signup moves straight into onboarding instead of repeating registration.",
                "Account details remain a lightweight local confirmation step.",
                "Keyword choices map to onboarding.interestKeywords.",
                "Completion flips the local onboarding status to completed.",
                "Temporary profile answers stay branch-local on purpose.",
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
                  Progress
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {snapshot.onboarding.status === "completed"
                    ? "Onboarding complete"
                    : "Setup in progress"}
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
                Reset local flow
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
                    className={`flex items-center justify-between rounded-[1.35rem] border px-4 py-3 text-left ${
                      active
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-white/65 bg-white/78 text-slate-900"
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
                      {complete ? "Done" : active ? "Now" : "Pending"}
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
                Step 1
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Confirm your account setup
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                This step stays as a lightweight bridge for the Phase 1 contract.
                If you arrived from signup, you can skip straight to interests.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-800 md:col-span-2">
                  Campus email
                  <input
                    className="field"
                    value={snapshot.account.email}
                    onChange={(event) => updateAccount("email", event.target.value)}
                    placeholder="you@campus.ac.kr"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  Password
                  <input
                    type="password"
                    className="field"
                    value={snapshot.account.password}
                    onChange={(event) =>
                      updateAccount("password", event.target.value)
                    }
                    placeholder="At least 8 characters"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  Display name
                  <input
                    className="field"
                    value={snapshot.account.displayName}
                    onChange={(event) =>
                      updateAccount("displayName", event.target.value)
                    }
                    placeholder="How teammates will see you"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-800 md:col-span-2">
                  Campus
                  <input
                    className="field"
                    value={snapshot.account.campus}
                    onChange={(event) => updateAccount("campus", event.target.value)}
                    placeholder="Optional until identity contracts merge"
                  />
                </label>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAccountContinue}
                  className="button-primary"
                >
                  Save and continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(beginOnboardingSurvey());
                    setError("");
                  }}
                  className="button-secondary"
                >
                  Skip to interests
                </button>
              </div>
            </>
          ) : null}

          {currentStep === "interests" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Step 2
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Pick your keywords
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                These selections map directly to the Phase 1
                `interestKeywords` contract and are normalized in the adapter.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {availableKeywords.map((keyword) => {
                  const active = selectedKeywords.includes(keyword);

                  return (
                    <button
                      type="button"
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      className={`rounded-full px-4 py-3 text-sm font-semibold ${
                        active
                          ? "bg-slate-950 text-white"
                          : "border border-slate-200/80 bg-white/84 text-slate-700"
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
                  placeholder="Add your own keyword"
                />
                <button
                  type="button"
                  onClick={addCustomKeyword}
                  className="button-secondary"
                >
                  Add keyword
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
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleInterestContinue}
                  className="button-primary"
                >
                  Continue to profile
                </button>
              </div>
            </>
          ) : null}

          {currentStep === "profile" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Step 3
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Finish the onboarding shell
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                These fields are intentionally branch-local placeholders so this
                survey branch does not lock the final profile shape before the
                profile contract work lands.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  Short intro
                  <textarea
                    className="field textarea"
                    value={snapshot.profile.intro}
                    onChange={(event) => updateProfile("intro", event.target.value)}
                    placeholder="What kind of teammate are you?"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    Collaboration style
                    <select
                      className="field"
                      value={snapshot.profile.collaborationStyle}
                      onChange={(event) =>
                        updateProfile("collaborationStyle", event.target.value)
                      }
                    >
                      <option value="">Select one</option>
                      <option value="async-first">Async-first</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="live-sprint">Live sprint</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-800">
                    Weekly hours
                    <select
                      className="field"
                      value={snapshot.profile.weeklyHours}
                      onChange={(event) =>
                        updateProfile("weeklyHours", event.target.value)
                      }
                    >
                      <option value="">Select one</option>
                      <option value="under-3">Under 3 hours</option>
                      <option value="3-6">3 to 6 hours</option>
                      <option value="6-10">6 to 10 hours</option>
                      <option value="10-plus">10+ hours</option>
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
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProfileComplete}
                  className="button-primary"
                >
                  Mark onboarding complete
                </button>
              </div>
            </>
          ) : null}

          {currentStep === "complete" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Complete
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                You reached the completion state
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                The local adapter has set `status=completed` and
                `currentStep=complete`, matching the downstream Phase 1 contract
                behavior.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/65 bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Display name
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {snapshot.account.displayName || "Not set"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/65 bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Completed at
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {snapshot.onboarding.completedAt ?? "Not completed"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.4rem] border border-white/65 bg-white/82 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Selected keywords
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
                  Edit profile step
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot(resetSurveySnapshot());
                    setError("");
                  }}
                  className="button-primary"
                >
                  Start over
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
              Contract Mapping
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              What will swap after merge
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                Account step will call `POST /api/auth/signup` instead of saving
                local draft state.
              </li>
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                Resume flow will read `GET /api/onboarding/state` instead of local
                storage.
              </li>
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                Interest updates will map to `PUT /api/onboarding/state` with
                `interestKeywords` and `currentStep`.
              </li>
              <li className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                Temporary profile draft fields remain branch-local until the
                profile contract branch defines shared shapes.
              </li>
            </ul>
          </div>

          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Quick Links
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/" className="button-secondary">
                Back to home
              </Link>
              <Link href="/signup" className="button-secondary">
                Back to signup
              </Link>
              <Link href="/onboarding" className="button-secondary">
                Resume onboarding
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
