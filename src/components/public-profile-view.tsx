import Image from "next/image";
import Link from "next/link";
import type { PublicProfileModel } from "@/lib/public-profile";

type PublicProfileViewProps = {
  model: PublicProfileModel;
};

export function PublicProfileView({ model }: PublicProfileViewProps) {
  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:items-center">
          <div className="flex flex-col items-start gap-4">
            <Image
              src={model.avatarUrl}
              alt={`${model.name} 프로필 이미지`}
              width={160}
              height={160}
              unoptimized
              className="h-40 w-40 rounded-[2rem] border border-white/70 object-cover shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
            />
            <span className="rounded-full bg-white/82 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Recruit Author
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {model.roleLabel}
            </p>
            <h1 className="section-title text-slate-950">{model.name}</h1>
            <p className="text-xl font-semibold text-slate-900">{model.headline}</p>
            <p className="max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
              {model.bio}
            </p>
            <div className="flex flex-wrap gap-2">
              {model.focusTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[color:var(--teal-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--teal)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {model.stats.map((item) => (
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

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            활동 캠퍼스
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {model.campuses.map((campus) => (
              <span
                key={campus}
                className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-2 text-sm font-semibold text-slate-800"
              >
                {campus}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {model.recentPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/recruit/${post.slug}`}
              className="panel rounded-[1.8rem] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    {post.categoryLabel}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {post.summary}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {post.deadlineLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
