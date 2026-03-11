import type {
  AuthContext,
  AuthenticatedAuthContext,
  OnboardingState,
  OnboardingStatus,
  OnboardingStep,
  UpdateOnboardingStateRequest,
} from "@/types/identity";
import {
  onboardingStatusValues,
  onboardingStepValues,
  roleValues,
} from "@/types/identity";

export const SESSION_COOKIE_NAME = "campus-link.session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function isRole(value: unknown): value is (typeof roleValues)[number] {
  return typeof value === "string" && roleValues.includes(value as never);
}

export function isOnboardingStatus(
  value: unknown,
): value is OnboardingStatus {
  return (
    typeof value === "string" &&
    onboardingStatusValues.includes(value as never)
  );
}

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return (
    typeof value === "string" && onboardingStepValues.includes(value as never)
  );
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeText(value: string) {
  return value.trim();
}

export function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function normalizeInterestKeywords(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: string) {
  return value.trim().length >= 8;
}

export function buildEmptyAuthContext(): AuthContext {
  return {
    authenticated: false,
    session: null,
    user: null,
    onboarding: null,
  };
}

export function buildAuthenticatedAuthContext(input: {
  session: AuthenticatedAuthContext["session"];
  user: AuthenticatedAuthContext["user"];
  onboarding: AuthenticatedAuthContext["onboarding"];
}): AuthenticatedAuthContext {
  return {
    authenticated: true,
    session: input.session,
    user: input.user,
    onboarding: input.onboarding,
  };
}

export function createInitialOnboardingState(
  userId: string,
  options?: Partial<OnboardingState>,
): OnboardingState {
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const updatedAt = options?.updatedAt ?? createdAt;

  return {
    userId,
    status: options?.status ?? "in_progress",
    currentStep: options?.currentStep ?? "interests",
    interestKeywords: options?.interestKeywords ?? [],
    completedAt: options?.completedAt ?? null,
    createdAt,
    updatedAt,
  };
}

export function applyOnboardingPatch(
  current: OnboardingState,
  patch: UpdateOnboardingStateRequest,
): OnboardingState {
  const interestKeywords =
    patch.interestKeywords === undefined
      ? current.interestKeywords
      : normalizeInterestKeywords(patch.interestKeywords);

  let status = patch.status ?? current.status;
  let currentStep = patch.currentStep ?? current.currentStep;

  if (currentStep === "complete") {
    status = "completed";
  }

  if (status === "completed") {
    currentStep = "complete";
  }

  if (status === "not_started" && currentStep === "complete") {
    status = "in_progress";
    currentStep = "interests";
  }

  return {
    ...current,
    status,
    currentStep,
    interestKeywords,
    completedAt: status === "completed" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

export function createSessionExpiryDate(now = Date.now()) {
  return new Date(now + SESSION_TTL_MS);
}
