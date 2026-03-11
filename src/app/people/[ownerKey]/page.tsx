import { notFound } from "next/navigation";
import { PublicProfileView } from "@/components/public-profile-view";
import { buildPublicProfileModel } from "@/lib/public-profile";
import { listRecruitPosts } from "@/lib/server/recruit-repository";

type PublicProfilePageProps = {
  params: Promise<{ ownerKey: string }>;
};

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { ownerKey } = await params;
  const posts = await listRecruitPosts();
  const model = buildPublicProfileModel(ownerKey, posts);

  if (!model) {
    notFound();
  }

  return <PublicProfileView model={model} />;
}
