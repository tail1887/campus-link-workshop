import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  buildAuthenticatedAuthContext,
  createInitialOnboardingState,
  createSessionExpiryDate,
  normalizeEmail,
} from "@/lib/identity";
import { hashPassword } from "@/lib/server/password";
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

type StoredMockUser = {
  user: User;
  passwordHash: string;
};

type PersistedMockIdentityState = {
  users: StoredMockUser[];
  onboardingStates: OnboardingState[];
  sessions: Session[];
};

function createSeedAccount(input: {
  id: string;
  email: string;
  password: string;
  displayName: string;
  campus: string | null;
  role: User["role"];
  onboarding: OnboardingState;
}): StoredMockUser {
  return {
    user: {
      id: input.id,
      email: input.email,
      displayName: input.displayName,
      campus: input.campus,
      role: input.role,
      createdAt: input.onboarding.createdAt,
      updatedAt: input.onboarding.updatedAt,
    },
    passwordHash: hashPassword(input.password),
  };
}

const seedCreatedAt = new Date("2026-03-11T00:00:00.000Z").toISOString();

const seedOnboardingStates = [
  createInitialOnboardingState("user_demo_student", {
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt,
    currentStep: "interests",
    status: "in_progress",
    interestKeywords: [],
  }),
  createInitialOnboardingState("user_demo_admin", {
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt,
    currentStep: "complete",
    status: "completed",
    interestKeywords: ["operations", "moderation"],
    completedAt: seedCreatedAt,
  }),
];

const seedUsers = new Map<string, StoredMockUser>(
  [
    createSeedAccount({
      id: "user_demo_student",
      email: "student@campus-link.demo",
      password: "jungle1234",
      displayName: "Kim Jungle",
      campus: "Krafton Jungle",
      role: "student",
      onboarding: seedOnboardingStates[0],
    }),
    createSeedAccount({
      id: "user_demo_admin",
      email: "admin@campus-link.demo",
      password: "admin1234",
      displayName: "Campus Link Ops",
      campus: "Campus Link",
      role: "admin",
      onboarding: seedOnboardingStates[1],
    }),
  ].map((record) => [record.user.id, record]),
);

const seedOnboardingStateMap = new Map<string, OnboardingState>(
  seedOnboardingStates.map((state) => [state.userId, state]),
);

const devPersistenceEnabled = process.env.NODE_ENV === "development";
const devPersistencePath = join(
  process.cwd(),
  ".local",
  "mock-identity-state.json",
);

function loadPersistedMockState(): PersistedMockIdentityState | null {
  if (!devPersistenceEnabled) {
    return null;
  }

  try {
    const raw = readFileSync(devPersistencePath, "utf8");
    return JSON.parse(raw) as PersistedMockIdentityState;
  } catch {
    return null;
  }
}

function createInitialMockState() {
  const users = new Map(seedUsers);
  const onboardingStates = new Map(seedOnboardingStateMap);
  const sessions = new Map<string, Session>();
  const persisted = loadPersistedMockState();

  if (persisted) {
    for (const storedUser of persisted.users) {
      users.set(storedUser.user.id, storedUser);
    }

    for (const onboardingState of persisted.onboardingStates) {
      onboardingStates.set(onboardingState.userId, onboardingState);
    }

    for (const session of persisted.sessions) {
      sessions.set(session.id, session);
    }
  }

  return {
    users,
    onboardingStates,
    sessions,
  };
}

function persistMockState() {
  if (!devPersistenceEnabled) {
    return;
  }

  mkdirSync(dirname(devPersistencePath), { recursive: true });
  writeFileSync(
    devPersistencePath,
    JSON.stringify(
      {
        users: [...mockUsers.values()],
        onboardingStates: [...mockOnboardingStates.values()],
        sessions: [...mockSessions.values()],
      } satisfies PersistedMockIdentityState,
      null,
      2,
    ),
    "utf8",
  );
}

const initialState = createInitialMockState();
const mockUsers = initialState.users;
const mockOnboardingStates = initialState.onboardingStates;
const mockSessions = initialState.sessions;

function getStoredUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  for (const record of mockUsers.values()) {
    if (normalizeEmail(record.user.email) === normalizedEmail) {
      return record;
    }
  }

  return null;
}

function getStoredUserById(userId: string) {
  return mockUsers.get(userId) ?? null;
}

function ensureOnboardingState(userId: string) {
  const existing = mockOnboardingStates.get(userId);

  if (existing) {
    return existing;
  }

  const created = createInitialOnboardingState(userId);
  mockOnboardingStates.set(userId, created);
  return created;
}

function isExpired(session: Session) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function findMockIdentityAccountByEmail(
  email: string,
): IdentityAccountRecord | null {
  const stored = getStoredUserByEmail(email);

  if (!stored) {
    return null;
  }

  return {
    user: stored.user,
    passwordHash: stored.passwordHash,
    onboarding: ensureOnboardingState(stored.user.id),
  };
}

export function createMockIdentityUser(
  input: CreateIdentityUserInput,
): IdentityAccountRecord {
  const now = new Date().toISOString();
  const userId = input.id ?? randomUUID();
  const onboarding = createInitialOnboardingState(userId, {
    createdAt: now,
    updatedAt: now,
    currentStep: "interests",
    status: "in_progress",
  });
  const user: User = {
    id: userId,
    email: input.email,
    displayName: input.displayName,
    campus: input.campus,
    role: input.role,
    createdAt: now,
    updatedAt: now,
  };

  const stored: StoredMockUser = {
    user,
    passwordHash: input.passwordHash,
  };

  mockUsers.set(user.id, stored);
  mockOnboardingStates.set(user.id, onboarding);
  persistMockState();

  return {
    user,
    passwordHash: stored.passwordHash,
    onboarding,
  };
}

export function createMockIdentitySession(userId: string): Session {
  const session: Session = {
    id: randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: createSessionExpiryDate().toISOString(),
  };

  mockSessions.set(session.id, session);
  persistMockState();
  return session;
}

export function deleteMockIdentitySession(sessionId: string) {
  mockSessions.delete(sessionId);
  persistMockState();
}

export function getMockAuthContextBySessionId(
  sessionId: string,
): AuthContext | null {
  const session = mockSessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (isExpired(session)) {
    mockSessions.delete(sessionId);
    persistMockState();
    return null;
  }

  const stored = getStoredUserById(session.userId);

  if (!stored) {
    mockSessions.delete(sessionId);
    persistMockState();
    return null;
  }

  return buildAuthenticatedAuthContext({
    session,
    user: stored.user,
    onboarding: ensureOnboardingState(stored.user.id),
  });
}

export function getMockOnboardingStateByUserId(userId: string) {
  const stored = getStoredUserById(userId);
  return stored ? ensureOnboardingState(userId) : null;
}

export function updateMockOnboardingState(state: OnboardingState) {
  mockOnboardingStates.set(state.userId, state);
  persistMockState();
  return state;
}
