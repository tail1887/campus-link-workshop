import { GithubAnalysisWorkspace } from "@/components/github-analysis-workspace";
import { buildGithubAnalysisViewModel } from "@/lib/github-analysis/adapter";
import { getAiPlatformProviderCatalog } from "@/lib/server/ai-platform-provider";
import { getGitHubConnectionRecord } from "@/lib/server/ai-platform-repository";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import { getProfileContextRecord } from "@/lib/server/profile-repository";

export const dynamic = "force-dynamic";

export default async function GithubAnalysisPage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    const model = buildGithubAnalysisViewModel({ authContext });
    return <GithubAnalysisWorkspace model={model} />;
  }

  const profileContext = await getProfileContextRecord({
    user: authContext.user,
    onboarding: authContext.onboarding,
  });
  const [connection, providers] = await Promise.all([
    getGitHubConnectionRecord(authContext.user),
    Promise.resolve(getAiPlatformProviderCatalog()),
  ]);

  const model = buildGithubAnalysisViewModel({
    authContext,
    profileContext: {
      ...profileContext,
      dataSource: getIdentityDataSource(),
    },
    connection,
    providers,
  });

  return <GithubAnalysisWorkspace model={model} />;
}
