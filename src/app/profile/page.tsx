import { ProfileShellView } from "@/components/profile-shell-view";
import { buildProfileShellViewModel } from "@/lib/profile-shell/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import {
  getProfileContextRecord,
  getVerificationRecord,
} from "@/lib/server/profile-repository";
import {
  listRecruitApplicationsByApplicant,
  listRecruitPosts,
} from "@/lib/server/recruit-repository";

export const dynamic = "force-dynamic";

export default async function UserProfileShellPage() {
  const authContext = await getCurrentAuthContext();
  const [verification, profileContext, managedPosts, applications] =
    authContext.authenticated
      ? await Promise.all([
          getVerificationRecord(authContext.user),
          getProfileContextRecord({
            user: authContext.user,
            onboarding: authContext.onboarding,
          }),
          listRecruitPosts(),
          listRecruitApplicationsByApplicant(authContext.user.id),
        ])
      : [null, null, [], []];
  const model = buildProfileShellViewModel({
    authContext,
    role: "student",
    verification,
    profile: profileContext?.profile ?? null,
    managedPostCount: authContext.authenticated
      ? managedPosts.filter((post) => post.ownerId === authContext.user.id).length
      : 0,
    applicationCount: applications.length,
  });

  return <ProfileShellView model={model} />;
}
