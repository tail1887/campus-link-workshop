import { ProfileShellView } from "@/components/profile-shell-view";
import { buildProfileShellViewModel } from "@/lib/profile-shell/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

export const dynamic = "force-dynamic";

export default async function AdminProfileShellPage() {
  const authContext = await getCurrentAuthContext();
  const model = buildProfileShellViewModel({
    authContext,
    role: "admin",
  });

  return <ProfileShellView model={model} />;
}
