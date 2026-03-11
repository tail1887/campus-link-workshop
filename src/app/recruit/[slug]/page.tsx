import { RecruitDetailView } from "@/components/recruit-detail-view";
import { findMockPost } from "@/lib/server/mock-recruit-repository";

type RecruitDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function RecruitDetailPage({
  params,
  searchParams,
}: RecruitDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const initialPost = findMockPost(slug);

  return (
    <RecruitDetailView
      slug={slug}
      initialPost={initialPost ?? null}
      created={query.created === "1"}
    />
  );
}
