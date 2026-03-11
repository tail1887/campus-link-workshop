import { ProfileShellView } from "@/components/profile-shell-view";
import { buildProfileShellViewModel } from "@/lib/profile-shell/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getVerificationRecord } from "@/lib/server/profile-repository";

export const dynamic = "force-dynamic";

export default async function AdminProfileShellPage() {
  const authContext = await getCurrentAuthContext();
  const verification = authContext.authenticated
    ? await getVerificationRecord(authContext.user)
    : null;
  const model = buildProfileShellViewModel({
    authContext,
    role: "admin",
    verification,
  });

  return <ProfileShellView model={model} />;
}
