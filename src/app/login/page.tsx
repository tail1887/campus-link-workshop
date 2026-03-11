import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getDefaultAuthEntryNextPath } from "@/lib/auth-entry/integration-points";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const nextPath = query.next ?? getDefaultAuthEntryNextPath("login");
  const authContext = await getCurrentAuthContext();

  if (authContext.authenticated) {
    redirect(nextPath);
  }

  return (
    <div className="shell pb-8 pt-6">
      <AuthForm mode="login" nextPath={nextPath} />
    </div>
  );
}
