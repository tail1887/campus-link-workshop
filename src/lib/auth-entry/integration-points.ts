import type { AuthEntryMode } from "@/lib/auth-entry/branch-auth-entry-adapter";

// Phase 1 C/D branches should replace these placeholders with their route entry points.
const DEFAULT_PATH_BY_MODE: Record<AuthEntryMode, string> = {
  signup: "/recruit/new",
  login: "/recruit/new",
};

export function getDefaultAuthEntryNextPath(mode: AuthEntryMode) {
  return DEFAULT_PATH_BY_MODE[mode];
}
