"use client";

import type {
  AuthSession,
  AuthStoredUser,
  LoginInput,
  SignupInput,
} from "@/types/auth";

const USERS_KEY = "campus-link.auth.users.v1";
const SESSION_KEY = "campus-link.auth.session.v1";
const AUTH_EVENT = "campus-link-auth-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function emitAuthChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isCampusEmail(email: string) {
  return normalizeEmail(email).endsWith(".ac.kr");
}

export function getStoredAuthUsers() {
  return readJson<AuthStoredUser[]>(USERS_KEY, []);
}

export function getAuthSession() {
  return readJson<AuthSession | null>(SESSION_KEY, null);
}

export function saveAuthSession(session: AuthSession) {
  writeJson(SESSION_KEY, session);
  emitAuthChange();
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  emitAuthChange();
}

export function subscribeAuthChange(listener: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SESSION_KEY || event.key === USERS_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_EVENT, listener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_EVENT, listener);
  };
}

export function registerMockUser(input: SignupInput) {
  const email = normalizeEmail(input.email);
  const users = getStoredAuthUsers();

  if (users.some((user) => user.email === email)) {
    return {
      ok: false as const,
      message: "이미 가입된 학교 이메일입니다.",
    };
  }

  const nextUser: AuthStoredUser = {
    id: `user_${Date.now().toString(36)}`,
    name: input.name.trim(),
    email,
    campus: input.campus.trim(),
    password: input.password,
    role: "student",
    createdAt: new Date().toISOString(),
  };

  writeJson(USERS_KEY, [nextUser, ...users]);

  const session: AuthSession = {
    userId: nextUser.id,
    name: nextUser.name,
    email: nextUser.email,
    campus: nextUser.campus,
    role: nextUser.role,
    signedInAt: new Date().toISOString(),
  };

  saveAuthSession(session);

  return {
    ok: true as const,
    user: nextUser,
    session,
  };
}

export function signInMockUser(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const user = getStoredAuthUsers().find(
    (item) => item.email === email && item.password === input.password,
  );

  if (!user) {
    return {
      ok: false as const,
      message: "이메일 또는 비밀번호를 다시 확인해주세요.",
    };
  }

  const session: AuthSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
    campus: user.campus,
    role: user.role,
    signedInAt: new Date().toISOString(),
  };

  saveAuthSession(session);

  return {
    ok: true as const,
    user,
    session,
  };
}
