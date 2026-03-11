import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getRecruitCreateEntry } from "@/lib/recruit-create-entry";
import { categoryMeta } from "@/lib/recruit";
import { getCurrentAuthContext } from "@/lib/server/auth-context";
import { listRecruitPosts } from "@/lib/server/recruit-repository";
import type { RecruitPost } from "@/types/recruit";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const authContext = await getCurrentAuthContext();
  const posts: RecruitPost[] = await listRecruitPosts();
  const createEntry = getRecruitCreateEntry(authContext.authenticated);
  const sortedPosts = [...posts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const spotlightPosts = posts.filter((post) => post.highlight).slice(0, 2);
  const curationLeadPosts =
    spotlightPosts.length > 0 ? spotlightPosts : sortedPosts.slice(0, 2);
  const leadPostSlugs = new Set(curationLeadPosts.map((post) => post.slug));
  const featuredPosts = sortedPosts
    .filter((post) => !leadPostSlugs.has(post.slug))
    .slice(0, 3);
  const secondaryCurationPosts =
    featuredPosts.length > 0 ? featuredPosts : curationLeadPosts;
  const openRoles = posts.reduce((sum, post) => sum + post.capacity, 0);
  const campusCount = new Set(posts.map((post) => post.campus)).size;

  return (
    <div className="shell space-y-8 pb-8 pt-6 sm:space-y-10 lg:space-y-16">
      <section className="mesh panel-strong animate-rise overflow-hidden rounded-[1.8rem] px-5 py-6 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-10 lg:py-12">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10">
          <div className="space-y-5 sm:space-y-6">
            <span className="eyebrow">Campus Matching Platform</span>
            <div className="space-y-3 sm:space-y-4">
              <h1 className="display max-w-4xl text-[clamp(2.6rem,13vw,5.8rem)] leading-[0.92] text-slate-950">
                Build crews,
                <br />
                not chaos.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-lg sm:leading-8">
                흩어진 모집글을 한 화면으로 모으고, 팀 소개부터 지원까지
                자연스럽게 이어지는 캠퍼스 스터디/프로젝트 매칭 경험을
                만듭니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/recruit" className="button-primary">
                모집글 둘러보기
                <span aria-hidden="true">/</span>
              </Link>
              <Link href={createEntry.href} className="button-secondary">
                {createEntry.label}
              </Link>
            </div>
            <p className="text-sm font-medium text-[color:var(--muted)]">
              {createEntry.hint}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-[1.25rem] border border-white/60 bg-white/78 p-3 sm:rounded-[1.5rem] sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Live Crews
                </p>
                <p className="display mt-2 text-2xl text-slate-950 sm:mt-3 sm:text-3xl">
                  {posts.length.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/60 bg-white/78 p-3 sm:rounded-[1.5rem] sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Open Roles
                </p>
                <p className="display mt-2 text-2xl text-slate-950 sm:mt-3 sm:text-3xl">
                  {openRoles}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/60 bg-white/78 p-3 sm:rounded-[1.5rem] sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Campuses
                </p>
                <p className="display mt-2 text-2xl text-slate-950 sm:mt-3 sm:text-3xl">
                  {campusCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4">
            <div className="panel rounded-[1.7rem] p-4 sm:rounded-[2rem] sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Today Board
                  </p>
                  <p className="mt-2 display text-xl text-slate-950 sm:text-2xl">
                    지금 바로 팀을 찾는 실시간 모집 보드
                  </p>
                </div>
                <div className="animate-float rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] sm:text-sm">
                  Vercel Ready
                </div>
              </div>
              <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 sm:grid-cols-2">
                {Object.entries(categoryMeta).map(([key, meta]) => (
                  <div
                    key={key}
                    className="rounded-[1.15rem] border p-3 sm:rounded-[1.35rem] sm:p-4"
                    style={{
                      borderColor: meta.border,
                      background: meta.surface,
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {meta.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                      {meta.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-[1.7rem] p-4 sm:rounded-[2rem] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Spotlight
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    지금 먼저 확인할 추천 모집글
                  </p>
                </div>
                <Link
                  href="/recruit"
                  className="text-sm font-semibold text-[color:var(--accent-strong)]"
                >
                  전체 보기
                </Link>
              </div>
              <div className="mt-4 space-y-2.5 sm:space-y-3">
                {curationLeadPosts.map((post, index) => (
                  <div
                    key={post.slug}
                    className="rounded-[1.15rem] border border-slate-200/70 bg-white/82 p-3 sm:rounded-[1.35rem] sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                          0{index + 1}
                        </p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {post.title}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                        {post.capacity} seats
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {post.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <span className="eyebrow">Why It Works</span>
          <h2 className="section-title text-slate-950">
            메인에서 바로
            <br />
            가치가 보여야 합니다.
          </h2>
          <p className="section-subtitle">
            Campus Link는 팀 탐색부터 지원까지의 핵심 흐름이 한 번에 보이도록
            설계되어, 처음 방문한 사용자도 빠르게 필요한 팀을 찾을 수 있습니다.
          </p>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          {[
            {
              title: "탐색 집중",
              description:
                "모집 유형과 역할이 카드에서 바로 보여서 비교가 빠릅니다.",
            },
            {
              title: "상세 설득",
              description:
                "팀 목표, 모집 역할, 일정이 명확하게 정리되어 지원 판단이 쉽습니다.",
            },
            {
              title: "지원 연결",
              description:
                "글 작성과 지원 흐름이 자연스럽게 이어져 팀 모집과 합류가 끊기지 않습니다.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="panel animate-rise rounded-[1.45rem] p-4 sm:rounded-[1.75rem] sm:p-5"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Step 0{index + 1}
              </p>
              <p className="mt-3 text-xl font-semibold text-slate-950">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Fresh Boards</span>
            <h2 className="section-title text-slate-950">
              최근 업데이트된
              <br />
              모집글 모아보기
            </h2>
          </div>
          <Link href="/recruit" className="button-secondary">
            전체 모집글 보기
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {secondaryCurationPosts.map((post, index) => (
            <PostCard
              key={post.slug}
              post={post}
              compact
              className="animate-rise"
              style={{ animationDelay: `${index * 140}ms` }}
            />
          ))}
        </div>
      </section>

      <section className="panel-strong rounded-[1.8rem] px-5 py-6 sm:rounded-[2rem] sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Core Flow</span>
            <h2 className="display text-3xl text-slate-950 sm:text-4xl">
              메인 → 목록 → 상세 → 지원 → 글쓰기
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              탐색 흐름과 생성 흐름을 모두 빠르게 오갈 수 있도록 두 개의 CTA를
              중심으로 주요 동선을 구성했습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/recruit" className="button-primary">
              지원하러 가기
            </Link>
            <Link href={createEntry.href} className="button-secondary">
              {createEntry.label}
            </Link>
          </div>
        </div>
        <p className="text-sm font-medium text-[color:var(--muted)]">
          {createEntry.hint}
        </p>
      </section>
    </div>
  );
}
