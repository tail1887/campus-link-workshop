import type { CSSProperties } from "react";
import Link from "next/link";
import { formatDateLabel, categoryMeta } from "@/lib/recruit";
import type { RecruitPost } from "@/types/recruit";

type PostCardProps = {
  post: RecruitPost;
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
};

export function PostCard({
  post,
  className,
  style,
  compact = false,
}: PostCardProps) {
  const meta = categoryMeta[post.category];
  const visibleRoles = post.roles.slice(0, compact ? 2 : 3);
  const visibleStacks = post.techStack.slice(0, compact ? 1 : 2);

  return (
    <Link
      href={`/recruit/${post.slug}`}
      className={`panel group flex h-full flex-col rounded-[1.55rem] p-4 sm:rounded-[1.9rem] sm:p-5 ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            color: meta.text,
            background: meta.surface,
            border: `1px solid ${meta.border}`,
          }}
        >
          {meta.label}
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
          {post.capacity}명 모집
        </div>
      </div>

      <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {post.campus}
          </p>
          <h3 className="mobile-clamp-2 text-lg font-semibold leading-7 text-slate-950 group-hover:text-[color:var(--accent-strong)] sm:text-xl sm:leading-8">
            {post.title}
          </h3>
        </div>
        <p className="mobile-clamp-2 text-sm leading-6 text-[color:var(--muted)] sm:leading-7">
          {post.summary}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        {visibleRoles.map((role, index) => (
          <span
            key={role}
            className={`rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ${
              !compact && index === visibleRoles.length - 1 ? "hidden sm:inline-flex" : ""
            }`}
          >
            {role}
          </span>
        ))}
        {visibleStacks.map((stack, index) => (
          <span
            key={stack}
            className={`rounded-full bg-[color:var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--teal)] ${
              !compact && index === visibleStacks.length - 1 ? "hidden sm:inline-flex" : ""
            }`}
          >
            {stack}
          </span>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4 text-sm text-[color:var(--muted)] sm:gap-3 sm:pt-6">
        <div className="rounded-[1rem] border border-white/60 bg-white/72 p-2.5 sm:rounded-[1.2rem] sm:p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            진행 단계
          </p>
          <p className="mt-1 font-semibold text-slate-900">{post.stage}</p>
        </div>
        <div className="rounded-[1rem] border border-white/60 bg-white/72 p-2.5 sm:rounded-[1.2rem] sm:p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            마감 일정
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {formatDateLabel(post.deadline)}
          </p>
        </div>
      </div>
    </Link>
  );
}
