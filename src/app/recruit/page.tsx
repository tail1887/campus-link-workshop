import { RecruitBoard } from "@/components/recruit-board";
import { getRecruitCreateEntry } from "@/lib/recruit-create-entry";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { listRecruitPosts } from "@/lib/server/recruit-repository";

export const dynamic = "force-dynamic";

export default async function RecruitListPage() {
  const authContext = await getCurrentAuthContext();

  return (
    <RecruitBoard
      initialPosts={await listRecruitPosts()}
      createEntry={getRecruitCreateEntry(authContext.authenticated)}
    />
  );
}
