import { redirect } from "next/navigation";
import { MyApplicationsPanel } from "@/components/my-applications-panel";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import {
  listRecruitApplicationsByApplicant,
  listRecruitPosts,
} from "@/lib/server/recruit-repository";

export const dynamic = "force-dynamic";

export default async function MyApplicationsPage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    redirect("/login?next=%2Fprofile%2Fapplications");
  }

  if (authContext.user.role !== "student") {
    redirect("/admin/profile");
  }

  return (
    <MyApplicationsPanel
      userId={authContext.user.id}
      initialApplications={await listRecruitApplicationsByApplicant(authContext.user.id)}
      initialPosts={await listRecruitPosts()}
    />
  );
}
