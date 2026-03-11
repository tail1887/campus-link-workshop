import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getDefaultAuthEntryNextPath } from "@/lib/auth-entry/integration-points";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

type SignupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const query = await searchParams;
  const nextPath = query.next ?? getDefaultAuthEntryNextPath("signup");
  const authContext = await getCurrentAuthContext();

  if (authContext.authenticated) {
    redirect(nextPath);
  }

  return (
    <div className="shell pb-8 pt-6">
      <AuthForm mode="signup" nextPath={nextPath} />
    </div>
  );
}
