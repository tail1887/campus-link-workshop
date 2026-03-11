import type {
  AiPlatformProviderCatalog,
  AiSuggestionResult,
  CreateAiSuggestionJobRequest,
  CreateGitHubAnalysisJobRequest,
  GitHubAnalysisResult,
  GitHubConnection,
} from "@/types/ai";
import type { User } from "@/types/identity";
import {
  createMockAiSuggestionResult,
  createMockGitHubAnalysisResult,
} from "@/lib/server/mock-ai-platform-provider";

export type GitHubAnalysisProviderInput = {
  user: User;
  connection: GitHubConnection;
  request: CreateGitHubAnalysisJobRequest;
};

export type AiSuggestionProviderInput = {
  user: User;
  request: CreateAiSuggestionJobRequest;
};

const providerCatalog: AiPlatformProviderCatalog = {
  githubConnection: {
    provider: "mock_github",
    label: "Mock GitHub Connector",
  },
  githubAnalysis: {
    provider: "mock_analysis",
    label: "Mock GitHub Analyzer",
  },
  aiSuggestion: {
    provider: "mock_suggestions",
    label: "Mock Suggestion Engine",
  },
};

export function getAiPlatformProviderCatalog() {
  return providerCatalog;
}

export async function executeGitHubAnalysis(
  input: GitHubAnalysisProviderInput,
): Promise<GitHubAnalysisResult> {
  return createMockGitHubAnalysisResult(input);
}

export async function executeAiSuggestions(
  input: AiSuggestionProviderInput,
): Promise<AiSuggestionResult> {
  return createMockAiSuggestionResult(input);
}
