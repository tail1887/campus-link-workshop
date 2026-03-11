import {
  createMockInquiry,
  getMockAlertPreferenceRecord,
  getMockProfileContext,
  getMockResumeRecord,
  getMockVerificationRecord,
  listMockInquiries,
  submitMockVerificationRequest,
  updateMockAlertPreferenceRecord,
  updateMockProfileContext,
  updateMockResumeRecord,
} from "@/lib/server/mock-profile-repository";
import {
  createPrismaInquiry,
  getPrismaAlertPreferenceRecord,
  getPrismaProfileContext,
  getPrismaResumeRecord,
  getPrismaVerificationRecord,
  listPrismaInquiries,
  submitPrismaVerificationRequest,
  updatePrismaAlertPreferenceRecord,
  updatePrismaProfileContext,
  updatePrismaResumeRecord,
} from "@/lib/server/prisma-profile-repository";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import { withRepositoryFallback } from "@/lib/server/repository-fallback";
import type { OnboardingState, User } from "@/types/identity";
import type {
  CreateInquiryRequest,
  SubmitVerificationRequest,
  UpdateAlertPreferenceRequest,
  UpdateProfileRequest,
  UpdateResumeRequest,
} from "@/types/profile";

export async function getProfileContextRecord(input: {
  user: User;
  onboarding: OnboardingState;
}) {
  if (getIdentityDataSource() !== "database") {
    return getMockProfileContext(input);
  }

  return withRepositoryFallback({
    scope: "profile.getProfileContextRecord",
    database: () => getPrismaProfileContext(input),
    mock: () => getMockProfileContext(input),
  });
}

export async function updateProfileContextRecord(input: {
  user: User;
  onboarding: OnboardingState;
  patch: UpdateProfileRequest;
}) {
  if (getIdentityDataSource() !== "database") {
    return updateMockProfileContext(input);
  }

  return withRepositoryFallback({
    scope: "profile.updateProfileContextRecord",
    database: () => updatePrismaProfileContext(input),
    mock: () => updateMockProfileContext(input),
  });
}

export async function getResumeRecord(user: User) {
  if (getIdentityDataSource() !== "database") {
    return getMockResumeRecord(user);
  }

  return withRepositoryFallback({
    scope: "profile.getResumeRecord",
    database: () => getPrismaResumeRecord(user),
    mock: () => getMockResumeRecord(user),
  });
}

export async function updateResumeRecord(user: User, patch: UpdateResumeRequest) {
  if (getIdentityDataSource() !== "database") {
    return updateMockResumeRecord(user, patch);
  }

  return withRepositoryFallback({
    scope: "profile.updateResumeRecord",
    database: () => updatePrismaResumeRecord(user, patch),
    mock: () => updateMockResumeRecord(user, patch),
  });
}

export async function getVerificationRecord(user: User) {
  if (getIdentityDataSource() !== "database") {
    return getMockVerificationRecord(user);
  }

  return withRepositoryFallback({
    scope: "profile.getVerificationRecord",
    database: () => getPrismaVerificationRecord(user),
    mock: () => getMockVerificationRecord(user),
  });
}

export async function submitVerificationRecord(
  user: User,
  input: SubmitVerificationRequest,
) {
  if (getIdentityDataSource() !== "database") {
    return submitMockVerificationRequest(user, input);
  }

  return withRepositoryFallback({
    scope: "profile.submitVerificationRecord",
    database: () => submitPrismaVerificationRequest(user, input),
    mock: () => submitMockVerificationRequest(user, input),
  });
}

export async function listInquiryRecords(user: User) {
  if (getIdentityDataSource() !== "database") {
    return listMockInquiries(user);
  }

  return withRepositoryFallback({
    scope: "profile.listInquiryRecords",
    database: () => listPrismaInquiries(user),
    mock: () => listMockInquiries(user),
  });
}

export async function createInquiryRecord(
  user: User,
  input: CreateInquiryRequest,
) {
  if (getIdentityDataSource() !== "database") {
    return createMockInquiry(user, input);
  }

  return withRepositoryFallback({
    scope: "profile.createInquiryRecord",
    database: () => createPrismaInquiry(user, input),
    mock: () => createMockInquiry(user, input),
  });
}

export async function getAlertPreferenceRecord(user: User) {
  if (getIdentityDataSource() !== "database") {
    return getMockAlertPreferenceRecord(user);
  }

  return withRepositoryFallback({
    scope: "profile.getAlertPreferenceRecord",
    database: () => getPrismaAlertPreferenceRecord(user),
    mock: () => getMockAlertPreferenceRecord(user),
  });
}

export async function updateAlertPreferenceRecord(
  user: User,
  patch: UpdateAlertPreferenceRequest,
) {
  if (getIdentityDataSource() !== "database") {
    return updateMockAlertPreferenceRecord(user, patch);
  }

  return withRepositoryFallback({
    scope: "profile.updateAlertPreferenceRecord",
    database: () => updatePrismaAlertPreferenceRecord(user, patch),
    mock: () => updateMockAlertPreferenceRecord(user, patch),
  });
}
