import { ResumeWorkspace } from "@/components/resume-workspace";
import { buildResumeWorkspaceViewModel } from "@/lib/resume-workspace/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getIdentityDataSource } from "@/lib/server/identity-repository";
import {
  getProfileContextRecord,
  getResumeRecord,
} from "@/lib/server/profile-repository";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    const model = buildResumeWorkspaceViewModel({ authContext });
    return <ResumeWorkspace model={model} />;
  }

  const dataSource = getIdentityDataSource();
  const [profileContext, resumeRecord] = await Promise.all([
    getProfileContextRecord({
      user: authContext.user,
      onboarding: authContext.onboarding,
    }),
    getResumeRecord(authContext.user),
  ]);

  const model = buildResumeWorkspaceViewModel({
    authContext,
    dataSource,
    profileContext,
    resumeRecord,
  });

  return <ResumeWorkspace model={model} />;
}
