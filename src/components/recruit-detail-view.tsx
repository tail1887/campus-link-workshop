"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApplyPanel } from "@/components/apply-panel";
import { categoryMeta, formatDateLabel, formatDateTimeLabel } from "@/lib/recruit";
import { getStoredApplications, getStoredPosts } from "@/lib/storage";
import type { RecruitPost } from "@/types/recruit";

type RecruitDetailViewProps = {
  slug: string;
  initialPost: RecruitPost | null;
  created: boolean;
  currentUser: {
    id: string;
    email: string;
    displayName: string;
  } | null;
};

export function RecruitDetailView({
  slug,
  initialPost,
  created,
  currentUser,
}: RecruitDetailViewProps) {
  const [post, setPost] = useState<RecruitPost | null>(initialPost);
  const [hydrated, setHydrated] = useState(false);
  const [localApplyCount, setLocalApplyCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const localPost =
        getStoredPosts().find((item) => item.slug === slug) ?? initialPost;
      const applications = getStoredApplications().filter(
        (item) => item.postSlug === slug,
      );

      setPost(localPost ?? null);
      setLocalApplyCount(applications.length);
      setHydrated(true);
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [initialPost, slug]);

  if (!hydrated && !post) {
    return (
      <div className="shell pt-6">
        <div className="panel-strong rounded-[2rem] px-6 py-10 text-center">
          <p className="display text-2xl text-slate-950">모집글을 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="shell pt-6">
        <div className="panel-strong rounded-[2rem] px-6 py-10 text-center">
          <p className="display text-3xl text-slate-950">
            찾고 있는 모집글이 없습니다.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
            삭제되었거나 다른 브라우저의 fallback 저장에만 남아 있는 글일 수
            있습니다. 목록으로 돌아가 새 흐름을 이어가 보세요.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/recruit" className="button-primary">
              모집글 목록으로
            </Link>
            <Link href="/recruit/new" className="button-secondary">
              새 글 작성하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const meta = categoryMeta[post.category];

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[color:var(--muted)]">
          <Link href="/" className="hover:text-slate-950">
            메인
          </Link>
          <span>/</span>
          <Link href="/recruit" className="hover:text-slate-950">
            모집글 목록
          </Link>
          <span>/</span>
          <span className="text-slate-950">{post.title}</span>
        </div>

        {created ? (
          <div className="mt-5 rounded-[1.4rem] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            모집글이 생성되었습니다. 지금 이 화면을 그대로 발표 흐름에 사용할 수
            있습니다.
          </div>
        ) : null}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  color: meta.text,
                  background: meta.surface,
                  border: `1px solid ${meta.border}`,
                }}
              >
                {meta.label}
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1 text-xs font-semibold text-slate-700">
                {post.stage}
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1 text-xs font-semibold text-slate-700">
                {post.campus}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="section-title text-slate-950">{post.title}</h1>
              <p className="section-subtitle max-w-3xl">{post.summary}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "추가 모집", value: `${post.capacity}명` },
                { label: "현재 팀", value: `${post.currentMembers}명` },
                { label: "진행 방식", value: post.meetingStyle },
                { label: "마감", value: formatDateLabel(post.deadline) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="panel rounded-[1.8rem] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Team Goal
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {post.goal}
                </p>
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[color:var(--muted)]">
                  {post.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="panel rounded-[1.8rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Needed Roles
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-2 text-sm font-semibold text-slate-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="panel rounded-[1.8rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Tech Stack
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.techStack.map((stack) => (
                      <span
                        key={stack}
                        className="rounded-full bg-[color:var(--teal-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--teal)]"
                      >
                        {stack}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="panel rounded-[1.8rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    What We Expect
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
                    {post.expectations.map((item) => (
                      <li key={item} className="rounded-[1.2rem] bg-white/82 px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="panel rounded-[1.8rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Team Benefits
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
                    {post.perks.map((item) => (
                      <li key={item} className="rounded-[1.2rem] bg-white/82 px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="panel rounded-[1.8rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Team Lead
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {post.ownerName}
              </h2>
              <p className="mt-1 text-sm font-medium text-[color:var(--muted)]">
                {post.ownerRole}
              </p>
              <div className="mt-5 grid gap-3 text-sm leading-7 text-[color:var(--muted)]">
                <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                  <span className="font-semibold text-slate-900">활동 일정</span>
                  <p>{post.schedule}</p>
                </div>
                <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                  <span className="font-semibold text-slate-900">작성 시각</span>
                  <p>{formatDateTimeLabel(post.createdAt)}</p>
                </div>
                <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                  <span className="font-semibold text-slate-900">로컬 지원 수</span>
                  <p>{localApplyCount}건</p>
                </div>
              </div>
            </div>
            <ApplyPanel post={post} currentUser={currentUser} />
          </aside>
        </div>
      </section>
    </div>
  );
}
