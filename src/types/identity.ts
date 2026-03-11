export const roleValues = ["student", "admin"] as const;

export type Role = (typeof roleValues)[number];

export const onboardingStatusValues = [
  "not_started",
  "in_progress",
  "completed",
] as const;

export type OnboardingStatus = (typeof onboardingStatusValues)[number];

export const onboardingStepValues = [
  "account",
  "interests",
  "profile",
  "complete",
] as const;

export type OnboardingStep = (typeof onboardingStepValues)[number];

export type IdentityDataSource = "mock" | "database";

export type User = {
  id: string;
  email: string;
  displayName: string;
  campus: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type OnboardingState = {
  userId: string;
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  interestKeywords: string[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnonymousAuthContext = {
  authenticated: false;
  session: null;
  user: null;
  onboarding: null;
};

export type AuthenticatedAuthContext = {
  authenticated: true;
  session: Session;
  user: User;
  onboarding: OnboardingState;
};

export type AuthContext =
  | AnonymousAuthContext
  | AuthenticatedAuthContext;

export type SignupRequest = {
  email: string;
  password: string;
  displayName: string;
  campus?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type UpdateOnboardingStateRequest = {
  status?: OnboardingStatus;
  currentStep?: OnboardingStep;
  interestKeywords?: string[];
};

export type AuthContextPayload = AuthContext & {
  dataSource: IdentityDataSource;
};

export type OnboardingStatePayload = {
  onboarding: OnboardingState;
  dataSource: IdentityDataSource;
};

export type IdentitySessionClearPayload = {
  cleared: boolean;
  dataSource: IdentityDataSource;
};

export type IdentityErrorCode =
  | "AUTH_REQUIRED"
  | "EMAIL_ALREADY_IN_USE"
  | "INVALID_CREDENTIALS"
  | "INVALID_INPUT";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError<Code extends string = IdentityErrorCode> = {
  success: false;
  error: {
    code: Code;
    message: string;
  };
};
