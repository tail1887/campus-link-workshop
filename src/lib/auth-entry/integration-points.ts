export type AuthEntryMode = "login" | "signup";

const DEFAULT_PATH_BY_MODE: Record<AuthEntryMode, string> = {
  signup: "/onboarding",
  login: "/recruit",
};

export function getDefaultAuthEntryNextPath(mode: AuthEntryMode) {
  return DEFAULT_PATH_BY_MODE[mode];
}
