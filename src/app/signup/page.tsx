import { redirect } from "next/navigation";
import { AuthEntryForm } from "@/components/auth-entry-form";
import { getAuthEntrySession } from "@/lib/auth-entry/branch-auth-entry-adapter";
import { getDefaultAuthEntryNextPath } from "@/lib/auth-entry/integration-points";

type SignupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const query = await searchParams;
  const nextPath = query.next ?? getDefaultAuthEntryNextPath("signup");
  const session = await getAuthEntrySession();

  if (session) {
    redirect(nextPath);
  }

  return (
    <div className="shell pb-8 pt-6">
      <AuthEntryForm mode="signup" nextPath={nextPath} />
    </div>
  );
}
