import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { categoryMeta } from "@/lib/recruit";
import { listRecruitPosts } from "@/lib/server/recruit-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await listRecruitPosts();
  const featuredPosts = posts.filter((post) => post.highlight).slice(0, 3);
  const openRoles = posts.reduce((sum, post) => sum + post.capacity, 0);
  const campusCount = new Set(posts.map((post) => post.campus)).size;

  return (
    <div className="shell space-y-10 pb-8 pt-6 lg:space-y-16">
      <section className="mesh panel-strong animate-rise overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="eyebrow">Campus Matching Platform</span>
            <div className="space-y-4">
              <h1 className="display max-w-4xl text-[clamp(3rem,7vw,5.8rem)] leading-[0.9] text-slate-950">
                Build crews,
                <br />
                not chaos.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
                흩어진 모집글을 한 화면으로 모으고, 팀 소개부터 지원까지
                자연스럽게 이어지는 캠퍼스 스터디/프로젝트 매칭 경험을
                만듭니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="button-primary">
                학교 이메일로 시작하기
              </Link>
              <Link href="/recruit" className="button-primary">
                모집글 둘러보기
                <span aria-hidden="true">/</span>
              </Link>
              <Link href="/recruit/new" className="button-secondary">
                새 모집글 쓰기
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/60 bg-white/78 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Live Crews
                </p>
                <p className="display mt-3 text-3xl text-slate-950">
                  {posts.length.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/60 bg-white/78 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Open Roles
                </p>
                <p className="display mt-3 text-3xl text-slate-950">
                  {openRoles}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/60 bg-white/78 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Campuses
                </p>
                <p className="display mt-3 text-3xl text-slate-950">
                  {campusCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="panel rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Today Board
                  </p>
                  <p className="mt-2 display text-2xl text-slate-950">
                    발표 흐름을 위한 한 화면 데모
                  </p>
                </div>
                <div className="animate-float rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                  Vercel Ready
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(categoryMeta).map(([key, meta]) => (
                  <div
                    key={key}
                    className="rounded-[1.35rem] border p-4"
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

            <div className="panel rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Spotlight
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    지금 바로 지원이 많이 붙는 라인업
                  </p>
                </div>
                <Link
                  href="/recruit"
                  className="text-sm font-semibold text-[color:var(--accent-strong)]"
                >
                  전체 보기
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {featuredPosts.map((post, index) => (
                  <div
                    key={post.slug}
                    className="rounded-[1.35rem] border border-slate-200/70 bg-white/82 p-4"
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

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <span className="eyebrow">Why It Works</span>
          <h2 className="section-title text-slate-950">
            메인에서 바로
            <br />
            가치가 보여야 합니다.
          </h2>
          <p className="section-subtitle">
            Campus Link는 발표 때 설명이 길어지지 않도록, 문제 정의와 사용자
            행동이 화면 구조 안에 바로 드러나게 설계했습니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
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
              title: "데모 완결",
              description:
                "글쓰기와 지원하기가 데모 저장 흐름으로 이어져 발표 중 흐름이 끊기지 않습니다.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="panel animate-rise rounded-[1.75rem] p-5"
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

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-3">
            <span className="eyebrow">Featured Boards</span>
            <h2 className="section-title text-slate-950">
              발표에 바로 쓰기 좋은
              <br />
              대표 모집글 라인업
            </h2>
          </div>
          <Link href="/recruit" className="button-secondary">
            전체 모집글 보기
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {featuredPosts.map((post, index) => (
            <PostCard
              key={post.slug}
              post={post}
              className="animate-rise"
              style={{ animationDelay: `${index * 140}ms` }}
            />
          ))}
        </div>
      </section>

      <section className="panel-strong rounded-[2rem] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Demo Flow</span>
            <h2 className="display text-3xl text-slate-950 sm:text-4xl">
              메인 → 목록 → 상세 → 지원 → 글쓰기
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              발표에서는 탐색 흐름과 생성 흐름을 모두 보여줄 수 있도록 두 개의
              CTA를 중심으로 동선을 설계했습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/recruit" className="button-primary">
              지원 플로우 시연
            </Link>
            <Link href="/recruit/new" className="button-secondary">
              글쓰기 플로우 시연
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
