export type PostAiAssistReplacementPoint = {
  id: string;
  title: string;
  description: string;
  target:
    | "title"
    | "summary"
    | "description"
    | "request_adapter"
    | "draft_bridge";
  replaceWhen: string;
};

export const postAiAssistReplacementPoints: PostAiAssistReplacementPoint[] = [
  {
    id: "post-title-suggestion-slot",
    title: "Title Suggestion Slot",
    description:
      "The title field writes into the shared recruit suggestion request using the current draft snapshot, then applies returned text suggestions back through the same draft setter.",
    target: "title",
    replaceWhen:
      "The post creation form builds a recruit_title job request and renders the returned text suggestions.",
  },
  {
    id: "post-summary-suggestion-slot",
    title: "Summary Suggestion Slot",
    description:
      "The summary input provides sourceText context to the AI job request and keeps the apply action as a direct draft update instead of changing the create-post API.",
    target: "summary",
    replaceWhen:
      "The form maps recruit_summary suggestions into the existing summary field handler.",
  },
  {
    id: "post-description-suggestion-slot",
    title: "Description Suggestion Slot",
    description:
      "The description textarea stays the source of truth for submission while AI suggestions only replace the local draft value.",
    target: "description",
    replaceWhen:
      "The form consumes recruit_description job results and writes selected text into the description field.",
  },
  {
    id: "post-ai-request-adapter",
    title: "Request Adapter Slot",
    description:
      "Convert the existing recruit create draft into `RecruitPostAiDraft` and `RecruitPostAiSuggestionRequest` without modifying the recruit post submit payload.",
    target: "request_adapter",
    replaceWhen:
      "The create form calls `/api/ai/suggestions/jobs` with shared request validation from Phase 3 A.",
  },
  {
    id: "post-ai-draft-bridge",
    title: "Draft Bridge Slot",
    description:
      "Keep the form-level draft update handlers as the stable seam so AI results and manual edits both feed the same preview and create-post submit flow.",
    target: "draft_bridge",
    replaceWhen:
      "Selected suggestions, preview rendering, and final POST /api/posts all use the same draft object.",
  },
];
