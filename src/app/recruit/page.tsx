import { RecruitBoard } from "@/components/recruit-board";
import { listMockPosts } from "@/lib/server/mock-recruit-repository";

export default function RecruitListPage() {
  return <RecruitBoard initialPosts={listMockPosts()} />;
}
