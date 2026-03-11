import type { ResumeSectionKey } from "@/types/profile";

export type ResumeAiReplacementPoint = {
  id: string;
  title: string;
  description: string;
  target:
    | ResumeSectionKey
    | "title"
    | "visibility"
    | "profile_context"
    | "full_resume";
  replaceWhen: string;
};

export const resumeAiReplacementPoints: ResumeAiReplacementPoint[] = [
  {
    id: "resume-summary-assist",
    title: "Summary Assist Slot",
    description:
      "Summary suggestions now preview the current draft against AI-generated copy and can write back into the summary field.",
    target: "summary",
    replaceWhen:
      "Integrated in ResumeWorkspaceReady through the shared AI suggestion job flow and summary draft apply handler.",
  },
  {
    id: "resume-skills-normalizer",
    title: "Skills Assist Slot",
    description:
      "Skills suggestions now preview merged keyword sets and can normalize the current skills draft without changing the Phase 2 resume shape.",
    target: "skills",
    replaceWhen:
      "Integrated in ResumeWorkspaceReady through the shared AI suggestion job flow and skill merge apply handler.",
  },
  {
    id: "resume-experience-bullet-rewrite",
    title: "Experience Rewrite Slot",
    description:
      "Selected experience entries now request AI rewrites and apply the returned copy back into the existing textarea-backed draft.",
    target: "experience",
    replaceWhen:
      "Integrated in ResumeWorkspaceReady through selected experience context and per-entry apply handlers.",
  },
  {
    id: "resume-project-story-assist",
    title: "Project Story Slot",
    description:
      "Selected project entries now request AI story suggestions and apply the returned copy back into the current project description draft.",
    target: "projects",
    replaceWhen:
      "Integrated in ResumeWorkspaceReady through selected project context and per-entry apply handlers.",
  },
  {
    id: "resume-profile-context-provider",
    title: "Profile Context Slot",
    description:
      "Profile headline, open roles, and onboarding keywords now appear inside the AI request panel as explicit suggestion context.",
    target: "profile_context",
    replaceWhen:
      "Integrated in ResumeWorkspaceReady through the AI context panel and request builder.",
  },
  {
    id: "resume-full-review-panel",
    title: "Full Resume Review Slot",
    description:
      "The workspace now includes a full-review AI target that reads the same draft snapshot and completeness-driven context used elsewhere in the editor.",
    target: "full_resume",
    replaceWhen:
      "Integrated in ResumeWorkspaceReady through the shared AI suggestion job flow and review-only suggestion panel.",
  },
];
