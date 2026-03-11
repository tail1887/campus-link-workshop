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
import type { OnboardingState, User } from "@/types/identity";
import type {
  CreateInquiryRequest,
  SubmitVerificationRequest,
  UpdateAlertPreferenceRequest,
  UpdateProfileRequest,
  UpdateResumeRequest,
} from "@/types/profile";

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when RECRUIT_DATA_SOURCE=database.",
    );
  }
}

export async function getProfileContextRecord(input: {
  user: User;
  onboarding: OnboardingState;
}) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaProfileContext(input);
  }

  return getMockProfileContext(input);
}

export async function updateProfileContextRecord(input: {
  user: User;
  onboarding: OnboardingState;
  patch: UpdateProfileRequest;
}) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return updatePrismaProfileContext(input);
  }

  return updateMockProfileContext(input);
}

export async function getResumeRecord(user: User) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaResumeRecord(user);
  }

  return getMockResumeRecord(user);
}

export async function updateResumeRecord(user: User, patch: UpdateResumeRequest) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return updatePrismaResumeRecord(user, patch);
  }

  return updateMockResumeRecord(user, patch);
}

export async function getVerificationRecord(user: User) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaVerificationRecord(user);
  }

  return getMockVerificationRecord(user);
}

export async function submitVerificationRecord(
  user: User,
  input: SubmitVerificationRequest,
) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return submitPrismaVerificationRequest(user, input);
  }

  return submitMockVerificationRequest(user, input);
}

export async function listInquiryRecords(user: User) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return listPrismaInquiries(user);
  }

  return listMockInquiries(user);
}

export async function createInquiryRecord(
  user: User,
  input: CreateInquiryRequest,
) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaInquiry(user, input);
  }

  return createMockInquiry(user, input);
}

export async function getAlertPreferenceRecord(user: User) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaAlertPreferenceRecord(user);
  }

  return getMockAlertPreferenceRecord(user);
}

export async function updateAlertPreferenceRecord(
  user: User,
  patch: UpdateAlertPreferenceRequest,
) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return updatePrismaAlertPreferenceRecord(user, patch);
  }

  return updateMockAlertPreferenceRecord(user, patch);
}
