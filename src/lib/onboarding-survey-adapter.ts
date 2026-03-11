"use client";

export type SurveyOnboardingStatus = "not_started" | "in_progress" | "completed";

export type SurveyOnboardingStep =
  | "account"
  | "interests"
  | "profile"
  | "complete";

export type SurveyAccountDraft = {
  email: string;
  password: string;
  displayName: string;
  campus: string;
};

export type SurveyProfileDraft = {
  intro: string;
  collaborationStyle: string;
  weeklyHours: string;
};

export type SurveyOnboardingState = {
  status: SurveyOnboardingStatus;
  currentStep: SurveyOnboardingStep;
  interestKeywords: string[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SurveySnapshot = {
  account: SurveyAccountDraft;
  onboarding: SurveyOnboardingState;
  profile: SurveyProfileDraft;
};

const STORAGE_KEY = "campus-link.p1.onboarding-survey.v1";

const emptyAccount: SurveyAccountDraft = {
  email: "",
  password: "",
  displayName: "",
  campus: "",
};

const emptyProfile: SurveyProfileDraft = {
  intro: "",
  collaborationStyle: "",
  weeklyHours: "",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeKeywords(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildInitialOnboarding(): SurveyOnboardingState {
  const createdAt = nowIso();

  return {
    status: "not_started",
    currentStep: "account",
    interestKeywords: [],
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

function buildInitialSnapshot(): SurveySnapshot {
  return {
    account: emptyAccount,
    onboarding: buildInitialOnboarding(),
    profile: emptyProfile,
  };
}

function writeSnapshot(snapshot: SurveySnapshot) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadSurveySnapshot() {
  if (!isBrowser()) {
    return buildInitialSnapshot();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return buildInitialSnapshot();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SurveySnapshot>;

    return {
      account: {
        ...emptyAccount,
        ...parsed.account,
      },
      onboarding: {
        ...buildInitialOnboarding(),
        ...parsed.onboarding,
      },
      profile: {
        ...emptyProfile,
        ...parsed.profile,
      },
    };
  } catch {
    return buildInitialSnapshot();
  }
}

export function saveAccountDraft(account: SurveyAccountDraft) {
  const current = loadSurveySnapshot();
  const next: SurveySnapshot = {
    ...current,
    account,
    onboarding: {
      ...current.onboarding,
      status: "in_progress",
      currentStep: "interests",
      updatedAt: nowIso(),
    },
  };

  writeSnapshot(next);
  return next;
}

export function saveInterestKeywords(keywords: string[]) {
  const current = loadSurveySnapshot();
  const next: SurveySnapshot = {
    ...current,
    onboarding: {
      ...current.onboarding,
      status: "in_progress",
      currentStep: "profile",
      interestKeywords: normalizeKeywords(keywords),
      updatedAt: nowIso(),
    },
  };

  writeSnapshot(next);
  return next;
}

export function saveProfileDraft(profile: SurveyProfileDraft) {
  const current = loadSurveySnapshot();
  const next: SurveySnapshot = {
    ...current,
    profile,
    onboarding: {
      ...current.onboarding,
      status: "completed",
      currentStep: "complete",
      completedAt: nowIso(),
      updatedAt: nowIso(),
    },
  };

  writeSnapshot(next);
  return next;
}

export function goToStep(step: SurveyOnboardingStep) {
  const current = loadSurveySnapshot();
  const next: SurveySnapshot = {
    ...current,
    onboarding: {
      ...current.onboarding,
      status: step === "account" ? "not_started" : "in_progress",
      currentStep: step,
      completedAt: step === "complete" ? current.onboarding.completedAt : null,
      updatedAt: nowIso(),
    },
  };

  writeSnapshot(next);
  return next;
}

export function resetSurveySnapshot() {
  const next = buildInitialSnapshot();
  writeSnapshot(next);
  return next;
}
