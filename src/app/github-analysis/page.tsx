import { GithubAnalysisWorkspace } from "@/components/github-analysis-workspace";
import { buildGithubAnalysisViewModel } from "@/lib/github-analysis/adapter";
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

  const model = buildGithubAnalysisViewModel({
    authContext,
    profileContext: {
      ...profileContext,
      dataSource: getIdentityDataSource(),
    },
  });

  return <GithubAnalysisWorkspace model={model} />;
}
