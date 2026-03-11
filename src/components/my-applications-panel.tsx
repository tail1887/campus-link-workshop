"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta, formatDateLabel, formatDateTimeLabel, mergePosts } from "@/lib/recruit";
import { getStoredApplicationsByApplicant, getStoredPosts } from "@/lib/storage";
import type { RecruitApplication, RecruitPost } from "@/types/recruit";

type MyApplicationsPanelProps = {
  userId: string;
  initialApplications: RecruitApplication[];
  initialPosts: RecruitPost[];
};

function mergeApplications(
  localApplications: RecruitApplication[],
  serverApplications: RecruitApplication[],
) {
  const seen = new Set<string>();
  const merged: RecruitApplication[] = [];

  for (const application of [...localApplications, ...serverApplications]) {
    if (seen.has(application.id)) {
      continue;
    }

    seen.add(application.id);
    merged.push(application);
  }

  return merged.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

function getStatusLabel(status: RecruitApplication["status"]) {
  switch (status) {
    case "accepted":
      return "수락";
    case "rejected":
      return "거절";
    case "reviewed":
      return "검토 완료";
    default:
      return "검토 대기";
  }
}

export function MyApplicationsPanel({
  userId,
  initialApplications,
  initialPosts,
}: MyApplicationsPanelProps) {
  const [localApplications, setLocalApplications] = useState<RecruitApplication[]>([]);
  const [localPosts, setLocalPosts] = useState<RecruitPost[]>([]);

  useEffect(() => {
    const sync = () => {
      setLocalApplications(getStoredApplicationsByApplicant(userId));
      setLocalPosts(getStoredPosts());
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [userId]);

  const applications = mergeApplications(localApplications, initialApplications);
  const posts = useMemo(() => mergePosts(localPosts, initialPosts), [initialPosts, localPosts]);
  const postMap = useMemo(
    () => new Map(posts.map((post) => [post.slug, post])),
    [posts],
  );

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="space-y-4">
          <span className="eyebrow">My Applications</span>
          <h1 className="section-title text-slate-950">
            내가 참가한 글 관리
          </h1>
          <p className="section-subtitle">
            현재 세션으로 지원한 모집글과 접수 시간을 확인합니다. 모집글 원본이
            브라우저 저장본이면 같은 기준으로 병합해 보여줍니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { label: "내 참가 글", value: applications.length },
            {
              label: "검토 대기",
              value: applications.filter((item) => item.status === "pending").length,
            },
            {
              label: "마지막 지원",
              value:
                applications[0] ? formatDateTimeLabel(applications[0].createdAt) : "-",
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

      {applications.length > 0 ? (
        <section className="grid gap-4">
          {applications.map((application) => {
            const post = postMap.get(application.postSlug);
            const meta = post ? categoryMeta[post.category] : null;

            return (
              <Link
                key={application.id}
                href={post ? `/recruit/${post.slug}` : "/recruit"}
                className="panel rounded-[1.8rem] p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {meta ? (
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
                      ) : null}
                      <span className="rounded-full border border-slate-200/80 bg-white/84 px-3 py-1 text-xs font-semibold text-slate-700">
                        {getStatusLabel(application.status)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-950">
                        {post?.title ?? "원본 모집글을 찾을 수 없습니다."}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        {application.message}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm leading-7 text-[color:var(--muted)] lg:min-w-[240px]">
                    <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                      <span className="font-semibold text-slate-900">지원 연락처</span>
                      <p>{application.contact}</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                      <span className="font-semibold text-slate-900">지원 시각</span>
                      <p>{formatDateTimeLabel(application.createdAt)}</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/82 px-4 py-3">
                      <span className="font-semibold text-slate-900">마감일</span>
                      <p>{post ? formatDateLabel(post.deadline) : "-"}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="panel rounded-[1.8rem] px-6 py-10 text-center">
          <p className="display text-2xl text-slate-950">
            아직 참가한 글이 없습니다.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            모집글 상세에서 지원하면 이 화면에 바로 누적됩니다.
          </p>
          <Link href="/recruit" className="button-primary mt-6">
            모집글 둘러보기
          </Link>
        </section>
      )}
    </div>
  );
}
