import { RecruitDetailView } from "@/components/recruit-detail-view";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { findRecruitPost } from "@/lib/server/recruit-repository";

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
  const authContext = await getCurrentAuthContext();
  const initialPost = await findRecruitPost(slug);

  return (
    <RecruitDetailView
      slug={slug}
      initialPost={initialPost ?? null}
      created={query.created === "1"}
      currentUser={
        authContext.authenticated
          ? {
              id: authContext.user.id,
              email: authContext.user.email,
              displayName: authContext.user.displayName,
            }
          : null
      }
    />
  );
}
