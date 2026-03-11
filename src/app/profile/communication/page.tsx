import { CommunicationCenter } from "@/components/communication-center";
import { buildCommunicationCenterViewModel } from "@/lib/communication-center/adapter";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

export const dynamic = "force-dynamic";

export default async function ProfileCommunicationPage() {
  const authContext = await getCurrentAuthContext();
  const model = buildCommunicationCenterViewModel(authContext);

  return <CommunicationCenter model={model} />;
}
