import { ProfileEntryShell } from "@/components/profile-entry-shell";
import { buildProfileEntryViewModel } from "@/lib/profile-shell/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getVerificationRecord } from "@/lib/server/profile-repository";

export const dynamic = "force-dynamic";

export default async function ProfileEntryPage() {
  const authContext = await getCurrentAuthContext();
  const verification = authContext.authenticated
    ? await getVerificationRecord(authContext.user)
    : null;
  const model = buildProfileEntryViewModel(authContext, verification);

  return <ProfileEntryShell model={model} />;
}
