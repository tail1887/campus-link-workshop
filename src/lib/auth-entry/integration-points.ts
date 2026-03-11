export type AuthEntryMode = "login" | "signup";

// Phase 1 C/D branches should replace these placeholders with their route entry points.
const DEFAULT_PATH_BY_MODE: Record<AuthEntryMode, string> = {
  signup: "/onboarding",
  login: "/recruit/new",
};

export function getDefaultAuthEntryNextPath(mode: AuthEntryMode) {
  return DEFAULT_PATH_BY_MODE[mode];
}
