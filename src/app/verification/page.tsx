import { VerificationCenter } from "@/components/verification-center";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { getVerificationRecord } from "@/lib/server/profile-repository";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const authContext = await getCurrentAuthContext();
  const verification = authContext.authenticated
    ? await getVerificationRecord(authContext.user)
    : null;

  return (
    <VerificationCenter
      authUser={
        authContext.authenticated
          ? {
              id: authContext.user.id,
              email: authContext.user.email,
            }
          : null
      }
      initialVerification={verification}
    />
  );
}
