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
import {
  getConfiguredDataSource,
  withRepositoryFallback,
} from "@/lib/server/repository-fallback";
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

export function getIdentityDataSource(): IdentityDataSource {
  return getConfiguredDataSource();
}

export async function findIdentityAccountByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return withRepositoryFallback({
    scope: "identity.findIdentityAccountByEmail",
    database: () => findPrismaIdentityAccountByEmail(normalizedEmail),
    mock: () => findMockIdentityAccountByEmail(normalizedEmail),
  });
}

export async function createIdentityUser(input: CreateIdentityUserInput) {
  const normalizedInput = {
    ...input,
    email: normalizeEmail(input.email),
  };
  return withRepositoryFallback({
    scope: "identity.createIdentityUser",
    database: () => createPrismaIdentityUser(normalizedInput),
    mock: () => createMockIdentityUser(normalizedInput),
  });
}

export async function createIdentitySession(userId: string) {
  return withRepositoryFallback({
    scope: "identity.createIdentitySession",
    database: () => createPrismaIdentitySession(userId),
    mock: () => createMockIdentitySession(userId),
  });
}

export async function deleteIdentitySession(sessionId: string) {
  return withRepositoryFallback({
    scope: "identity.deleteIdentitySession",
    database: () => deletePrismaIdentitySession(sessionId),
    mock: () => deleteMockIdentitySession(sessionId),
  });
}

export async function getAuthContextBySessionId(
  sessionId: string,
): Promise<AuthContext | null> {
  return withRepositoryFallback({
    scope: "identity.getAuthContextBySessionId",
    database: () => getPrismaAuthContextBySessionId(sessionId),
    mock: () => getMockAuthContextBySessionId(sessionId),
  });
}

export async function getOnboardingStateByUserId(userId: string) {
  return withRepositoryFallback({
    scope: "identity.getOnboardingStateByUserId",
    database: () => getPrismaOnboardingStateByUserId(userId),
    mock: () => getMockOnboardingStateByUserId(userId),
  });
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

  return withRepositoryFallback({
    scope: "identity.updateIdentityOnboardingState",
    database: () => updatePrismaOnboardingState(nextState),
    mock: () => updateMockOnboardingState(nextState),
  });
}
