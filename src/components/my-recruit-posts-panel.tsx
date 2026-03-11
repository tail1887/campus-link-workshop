"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  categoryMeta,
  closeRecruitPost,
  deleteRecruitPost,
  formatDateLabel,
  isRecruitPostClosed,
  mergePosts,
} from "@/lib/recruit";
import {
  getStoredApplicationCountByPost,
  getStoredPostsByOwner,
  RECRUIT_STORAGE_SYNC_EVENT,
  updateStoredPost,
} from "@/lib/storage";
import type { RecruitPost } from "@/types/recruit";

type MyRecruitPostsPanelProps = {
  userId: string;
  initialPosts: RecruitPost[];
};

export function MyRecruitPostsPanel({
  userId,
  initialPosts,
}: MyRecruitPostsPanelProps) {
  const [localPosts, setLocalPosts] = useState<RecruitPost[]>([]);

  useEffect(() => {
    const sync = () => {
      setLocalPosts(getStoredPostsByOwner(userId));
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(RECRUIT_STORAGE_SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(RECRUIT_STORAGE_SYNC_EVENT, sync);
    };
  }, [userId]);

  const managedPosts = mergePosts(localPosts, initialPosts).filter(
    (post) => post.ownerId === userId,
  );

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">My Recruit Posts</span>
            <h1 className="section-title text-slate-950">
              내가 올린 모집 글 관리
            </h1>
            <p className="section-subtitle">
              현재 계정으로 작성한 모집글만 모아 봅니다. 최근에 작성한 브라우저
              저장 글도 함께 반영되어 이어서 관리할 수 있습니다.
            </p>
          </div>
          <Link href="/recruit/new" className="button-primary">
            새 모집글 작성
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { label: "내 모집 글", value: managedPosts.length },
            {
              label: "진행 중",
              value: managedPosts.filter((post) => !isRecruitPostClosed(post)).length,
            },
            {
              label: "가장 가까운 마감",
              value:
                managedPosts[0] ? formatDateLabel(managedPosts[0].deadline) : "-",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-white/65 bg-white/78 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {managedPosts.length > 0 ? (
        <section className="grid gap-4">
          {managedPosts.map((post) => {
            const meta = categoryMeta[post.category];

            return (
              <div key={post.slug} className="panel rounded-[1.8rem] p-5">
                <Link href={`/recruit/${post.slug}`} className="block">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
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
                        <span className="rounded-full border border-slate-200/80 bg-white/84 px-3 py-1 text-xs font-semibold text-slate-700">
                          {post.stage}
                        </span>
                      </div>
                      <div>
                        <h2 className="break-words text-2xl font-semibold text-slate-950 [overflow-wrap:anywhere]">
                          {post.title}
                        </h2>
                        <p className="mt-2 break-words text-sm leading-7 text-[color:var(--muted)] [overflow-wrap:anywhere]">
                          {post.summary}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm leading-7 text-[color:var(--muted)] lg:min-w-[230px]">
                      <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                        <span className="font-semibold text-slate-900">캠퍼스</span>
                        <p>{post.campus}</p>
                      </div>
                      <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                        <span className="font-semibold text-slate-900">마감일</span>
                        <p>{formatDateLabel(post.deadline)}</p>
                      </div>
                      <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                        <span className="font-semibold text-slate-900">모집 역할</span>
                        <p>{post.roles.join(", ")}</p>
                      </div>
                      <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                        <span className="font-semibold text-slate-900">지원 수</span>
                        <p>{getStoredApplicationCountByPost(post.slug)}건</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      updateStoredPost(
                        isRecruitPostClosed(post)
                          ? {
                              ...post,
                              stage: "모집 중",
                              updatedAt: new Date().toISOString(),
                              deletedAt: null,
                            }
                          : closeRecruitPost(post),
                      );
                    }}
                    className="button-secondary px-4 py-2 text-sm"
                  >
                    {isRecruitPostClosed(post) ? "모집 재개" : "모집 마감"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      updateStoredPost(deleteRecruitPost(post));
                    }}
                    className="button-ghost px-4 py-2 text-sm text-rose-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="panel rounded-[1.8rem] px-6 py-10 text-center">
          <p className="display text-2xl text-slate-950">
            아직 내 모집 글이 없습니다.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            로그인한 상태에서 새 모집글을 작성하면 여기서 바로 관리할 수 있습니다.
          </p>
          <Link href="/recruit/new" className="button-primary mt-6">
            첫 모집글 작성하기
          </Link>
        </section>
      )}
    </div>
  );
}
