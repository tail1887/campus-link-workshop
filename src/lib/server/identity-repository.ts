import { applyOnboardingPatch, normalizeEmail } from "@/lib/identity";
import {
  createMockIdentitySession,
  createMockIdentityUser,
  deleteMockIdentitySession,
  findMockIdentityAccountByEmail,
  getMockAuthContextBySessionId,
  getMockOnboardingStateByUserId,
  updateMockOnboardingState,
} from "@/lib/server/mock-identity-repository";
import {
  createPrismaIdentitySession,
  createPrismaIdentityUser,
  deletePrismaIdentitySession,
  findPrismaIdentityAccountByEmail,
  getPrismaAuthContextBySessionId,
  getPrismaOnboardingStateByUserId,
  updatePrismaOnboardingState,
} from "@/lib/server/prisma-identity-repository";
import type {
  AuthContext,
  IdentityDataSource,
  OnboardingState,
  Role,
  UpdateOnboardingStateRequest,
  User,
} from "@/types/identity";

export type IdentityAccountRecord = {
  user: User;
  passwordHash: string;
  onboarding: OnboardingState;
};

export type CreateIdentityUserInput = {
  id?: string;
  email: string;
  passwordHash: string;
  displayName: string;
  campus: string | null;
  role: Role;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when RECRUIT_DATA_SOURCE=database.",
    );
  }
}

export function getIdentityDataSource(): IdentityDataSource {
  return process.env.RECRUIT_DATA_SOURCE === "database" ? "database" : "mock";
}

export async function findIdentityAccountByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return findPrismaIdentityAccountByEmail(normalizedEmail);
  }

  return findMockIdentityAccountByEmail(normalizedEmail);
}

export async function createIdentityUser(input: CreateIdentityUserInput) {
  const normalizedInput = {
    ...input,
    email: normalizeEmail(input.email),
  };

  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaIdentityUser(normalizedInput);
  }

  return createMockIdentityUser(normalizedInput);
}

export async function createIdentitySession(userId: string) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return createPrismaIdentitySession(userId);
  }

  return createMockIdentitySession(userId);
}

export async function deleteIdentitySession(sessionId: string) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return deletePrismaIdentitySession(sessionId);
  }

  return deleteMockIdentitySession(sessionId);
}

export async function getAuthContextBySessionId(
  sessionId: string,
): Promise<AuthContext | null> {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaAuthContextBySessionId(sessionId);
  }

  return getMockAuthContextBySessionId(sessionId);
}

export async function getOnboardingStateByUserId(userId: string) {
  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return getPrismaOnboardingStateByUserId(userId);
  }

  return getMockOnboardingStateByUserId(userId);
}

export async function updateIdentityOnboardingState(
  userId: string,
  patch: UpdateOnboardingStateRequest,
) {
  const current = await getOnboardingStateByUserId(userId);

  if (!current) {
    return null;
  }

  const nextState = applyOnboardingPatch(current, patch);

  if (getIdentityDataSource() === "database") {
    assertDatabaseConfigured();
    return updatePrismaOnboardingState(nextState);
  }

  return updateMockOnboardingState(nextState);
}
