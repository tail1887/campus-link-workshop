import { ProfileEntryShell } from "@/components/profile-entry-shell";
import { buildProfileEntryViewModel } from "@/lib/profile-shell/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

export const dynamic = "force-dynamic";

export default async function ProfileEntryPage() {
  const authContext = await getCurrentAuthContext();
  const model = buildProfileEntryViewModel(authContext);

  return <ProfileEntryShell model={model} />;
}
