import { prisma } from "@/lib/server/prisma";
import {
  buildAuthenticatedAuthContext,
  createInitialOnboardingState,
  createSessionExpiryDate,
  normalizeEmail,
} from "@/lib/identity";
import type {
  AuthContext,
  OnboardingState,
  Session,
  User,
} from "@/types/identity";
import type {
  CreateIdentityUserInput,
  IdentityAccountRecord,
} from "@/lib/server/identity-repository";

function mapUser(record: {
  id: string;
  email: string;
  displayName: string;
  campus: string | null;
  role: User["role"];
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    campus: record.campus,
    role: record.role,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapSession(record: {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}): Session {
  return {
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
  };
}

function mapOnboarding(record: {
  userId: string;
  status: OnboardingState["status"];
  currentStep: OnboardingState["currentStep"];
  interestKeywords: string[];
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): OnboardingState {
  return {
    userId: record.userId,
    status: record.status,
    currentStep: record.currentStep,
    interestKeywords: record.interestKeywords,
    completedAt: record.completedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function fallbackOnboarding(user: User) {
  return createInitialOnboardingState(user.id, {
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    currentStep: "interests",
    status: "in_progress",
  });
}

export async function findPrismaIdentityAccountByEmail(
  email: string,
): Promise<IdentityAccountRecord | null> {
  const record = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
    include: {
      onboardingState: true,
    },
  });

  if (!record) {
    return null;
  }

  const user = mapUser(record);

  return {
    user,
    passwordHash: record.passwordHash,
    onboarding: record.onboardingState
      ? mapOnboarding(record.onboardingState)
      : fallbackOnboarding(user),
  };
}

export async function createPrismaIdentityUser(
  input: CreateIdentityUserInput,
): Promise<IdentityAccountRecord> {
  const record = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      campus: input.campus,
      role: input.role,
      onboardingState: {
        create: {
          status: "in_progress",
          currentStep: "interests",
          interestKeywords: [],
        },
      },
    },
    include: {
      onboardingState: true,
    },
  });

  return {
    user: mapUser(record),
    passwordHash: record.passwordHash,
    onboarding: mapOnboarding(record.onboardingState!),
  };
}

export async function createPrismaIdentitySession(userId: string) {
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: createSessionExpiryDate(),
    },
  });

  return mapSession(session);
}

export async function deletePrismaIdentitySession(sessionId: string) {
  await prisma.session.deleteMany({
    where: { id: sessionId },
  });
}

export async function getPrismaAuthContextBySessionId(
  sessionId: string,
): Promise<AuthContext | null> {
  const record = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          onboardingState: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await deletePrismaIdentitySession(sessionId);
    return null;
  }

  const user = mapUser(record.user);

  return buildAuthenticatedAuthContext({
    session: mapSession(record),
    user,
    onboarding: record.user.onboardingState
      ? mapOnboarding(record.user.onboardingState)
      : fallbackOnboarding(user),
  });
}

export async function getPrismaOnboardingStateByUserId(userId: string) {
  const record = await prisma.onboardingState.findUnique({
    where: { userId },
  });

  if (record) {
    return mapOnboarding(record);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user ? fallbackOnboarding(mapUser(user)) : null;
}

export async function updatePrismaOnboardingState(state: OnboardingState) {
  const record = await prisma.onboardingState.upsert({
    where: { userId: state.userId },
    create: {
      userId: state.userId,
      status: state.status,
      currentStep: state.currentStep,
      interestKeywords: state.interestKeywords,
      completedAt: state.completedAt ? new Date(state.completedAt) : null,
      createdAt: new Date(state.createdAt),
    },
    update: {
      status: state.status,
      currentStep: state.currentStep,
      interestKeywords: state.interestKeywords,
      completedAt: state.completedAt ? new Date(state.completedAt) : null,
    },
  });

  return mapOnboarding(record);
}
