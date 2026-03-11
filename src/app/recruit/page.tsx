import { RecruitBoard } from "@/components/recruit-board";
import { listRecruitPosts } from "@/lib/server/recruit-repository";

export const dynamic = "force-dynamic";

export default async function RecruitListPage() {
  return <RecruitBoard initialPosts={await listRecruitPosts()} />;
}
