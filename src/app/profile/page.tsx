import { ProfileShellView } from "@/components/profile-shell-view";
import { buildProfileShellViewModel } from "@/lib/profile-shell/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getVerificationRecord } from "@/lib/server/profile-repository";

export const dynamic = "force-dynamic";

export default async function UserProfileShellPage() {
  const authContext = await getCurrentAuthContext();
  const verification = authContext.authenticated
    ? await getVerificationRecord(authContext.user)
    : null;
  const model = buildProfileShellViewModel({
    authContext,
    role: "student",
    verification,
  });

  return <ProfileShellView model={model} />;
}
