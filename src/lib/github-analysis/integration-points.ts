export type GithubAnalysisIntegrationPoint = {
  id: string;
  title: string;
  description: string;
  replaceWhen: string;
};

export const githubAnalysisProfileIntegrationPoints: GithubAnalysisIntegrationPoint[] = [
  {
    id: "profile-growth-module-github",
    title: "Profile Growth Module",
    description:
      "Use the shared Phase 3 contract to replace the current GitHub analysis shortcut card in the student profile shell with live connection status and latest run summary.",
    replaceWhen:
      "feature/p3-ai-platform-contracts merges and the profile shell can read shared GitHub connection and job state data.",
  },
  {
    id: "profile-link-sync-github",
    title: "Profile Link Sync",
    description:
      "Promote the current branch-local username and profile URL fields into the canonical GitHub connection source so profile links and AI analysis no longer drift.",
    replaceWhen:
      "feature/p3-ai-platform-contracts defines the source of truth for GitHub connection metadata.",
  },
  {
    id: "resume-context-github-analysis",
    title: "Resume Context Feed",
    description:
      "Expose the latest repository themes, standout stack, and focus areas so resume AI assist can reuse the same project analysis context instead of re-asking for raw GitHub input.",
    replaceWhen:
      "feature/p3-resume-ai-assist consumes shared GitHub analysis output from the Phase 3 contract layer.",
  },
];

export const githubAnalysisAdminIntegrationPoints: GithubAnalysisIntegrationPoint[] = [
  {
    id: "admin-analysis-review-slot",
    title: "Admin Review Slot",
    description:
      "Reuse the latest connection status and run outcome to surface queued analysis health, stale syncs, or provider failures in admin oversight surfaces.",
    replaceWhen:
      "Phase 4 admin operations surfaces can read shared Phase 3 job status and GitHub connection records.",
  },
  {
    id: "admin-signal-summary-slot",
    title: "Admin Signal Summary",
    description:
      "Reuse project insight cards as a compact evidence block when moderators or operators need a quick summary of student project activity without opening the full profile.",
    replaceWhen:
      "feature/p4-admin-profile-content or later admin shells need a reusable project-analysis summary component.",
  },
];
