import { buildEmptyAuthContext } from "@/lib/identity";
import { getAuthContextBySessionId } from "@/lib/server/identity-repository";
import { getSessionCookieValue } from "@/lib/server/session-cookie";

export async function getCurrentAuthContext() {
  const sessionId = await getSessionCookieValue();

  if (!sessionId) {
    return buildEmptyAuthContext();
  }

  return (await getAuthContextBySessionId(sessionId)) ?? buildEmptyAuthContext();
}
