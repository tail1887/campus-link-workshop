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
      "Replace the static summary guidance with suggestion preview and apply actions that write back into the summary field.",
    target: "summary",
    replaceWhen:
      "feature/p3-resume-ai-assist wires shared AI suggestion responses into the summary editor.",
  },
  {
    id: "resume-skills-normalizer",
    title: "Skills Assist Slot",
    description:
      "Replace manual skill cleanup with AI-assisted normalization and ranking using the current resume draft as input.",
    target: "skills",
    replaceWhen:
      "feature/p3-resume-ai-assist adds skill suggestion chips and apply-to-draft handlers.",
  },
  {
    id: "resume-experience-bullet-rewrite",
    title: "Experience Rewrite Slot",
    description:
      "Attach per-entry bullet refinement or rewrite actions to each experience card without changing the stored Phase 2 resume shape.",
    target: "experience",
    replaceWhen:
      "feature/p3-resume-ai-assist introduces item-level suggestion panels for experience entries.",
  },
  {
    id: "resume-project-story-assist",
    title: "Project Story Slot",
    description:
      "Attach suggestion and apply controls for project description and tech stack framing on each project card.",
    target: "projects",
    replaceWhen:
      "feature/p3-resume-ai-assist connects project-level AI output to the existing draft update handlers.",
  },
  {
    id: "resume-profile-context-provider",
    title: "Profile Context Slot",
    description:
      "Promote the current profile snapshot and onboarding keywords into an explicit AI context block instead of a read-only helper panel.",
    target: "profile_context",
    replaceWhen:
      "feature/p3-resume-ai-assist consumes profile-linked context alongside the resume draft.",
  },
  {
    id: "resume-full-review-panel",
    title: "Full Resume Review Slot",
    description:
      "Replace the handoff note panel with an AI review surface that reads the same completeness and draft payload already used in this branch.",
    target: "full_resume",
    replaceWhen:
      "feature/p3-resume-ai-assist ships the end-to-end suggestion preview and apply workflow.",
  },
];
