import { redirect } from "next/navigation";
import { MyRecruitPostsPanel } from "@/components/my-recruit-posts-panel";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { listRecruitPosts } from "@/lib/server/recruit-repository";

export const dynamic = "force-dynamic";

export default async function MyRecruitPostsPage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    redirect("/login?next=%2Fprofile%2Frecruits");
  }

  if (authContext.user.role !== "student") {
    redirect("/admin/profile");
  }

  return (
    <MyRecruitPostsPanel
      userId={authContext.user.id}
      initialPosts={await listRecruitPosts()}
    />
  );
}
