import { redirect } from "next/navigation";
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

  if (!authContext.authenticated) {
    redirect("/entry");
  }

  const [verification, profileContext, managedPosts, applications] =
    await Promise.all([
      getVerificationRecord(authContext.user),
      getProfileContextRecord({
        user: authContext.user,
        onboarding: authContext.onboarding,
      }),
      listRecruitPosts(),
      listRecruitApplicationsByApplicant(authContext.user.id),
    ]);
  const model = buildProfileShellViewModel({
    authContext,
    role: "student",
    verification,
    profile: profileContext?.profile ?? null,
    managedPostCount: managedPosts.filter((post) => post.ownerId === authContext.user.id)
      .length,
    applicationCount: applications.length,
  });

  return <ProfileShellView model={model} />;
}
