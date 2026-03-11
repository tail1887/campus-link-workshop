"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { PostCard } from "@/components/post-card";
import type { RecruitCreateEntry } from "@/lib/recruit-create-entry";
import {
  categoryFilters,
  filterPosts,
  getCampusOptions,
  mergePosts,
} from "@/lib/recruit";
import { getStoredPosts } from "@/lib/storage";
import type { RecruitCategory, RecruitPost } from "@/types/recruit";

type RecruitBoardProps = {
  initialPosts: RecruitPost[];
  createEntry: RecruitCreateEntry;
};

export function RecruitBoard({ initialPosts, createEntry }: RecruitBoardProps) {
  const [localPosts, setLocalPosts] = useState<RecruitPost[]>([]);
  const [category, setCategory] = useState<"all" | RecruitCategory>("all");
  const [campus, setCampus] = useState("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const sync = () => {
      setLocalPosts(getStoredPosts());
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const merged = mergePosts(localPosts, initialPosts);
  const filtered = filterPosts(merged, { category, campus, query: deferredQuery });
  const campusOptions = getCampusOptions(merged);
  const highlighted = filtered.filter((post) => post.highlight).slice(0, 3);
  const highlightedSlugs = new Set(highlighted.map((post) => post.slug));
  const remainingPosts = filtered.filter((post) => !highlightedSlugs.has(post.slug));
  const hasActiveFilters = category !== "all" || campus !== "all" || query.trim().length > 0;

  const resetFilters = () => {
    setCategory("all");
    setCampus("all");
    setQuery("");
  };

  return (
    <div className="shell space-y-6 pb-8 pt-6 sm:space-y-8">
      <section className="panel-strong rounded-[1.8rem] px-5 py-6 sm:rounded-[2rem] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Recruit Board</span>
            <h1 className="section-title text-slate-950">
              지금 필요한 팀을
              <br />
              바로 찾는 모집글 허브
            </h1>
            <p className="section-subtitle">
              카테고리와 검색으로 빠르게 좁히고, 상세 페이지에서 팀 목표와
              역할을 한 번에 확인해 보세요. 최근에 작성한 내 브라우저 저장 글도
              함께 반영되어 이어서 탐색할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={createEntry.href} className="button-primary">
              {createEntry.label}
            </Link>
            <div className="rounded-[1.25rem] border border-white/60 bg-white/78 px-4 py-3 text-sm font-semibold text-[color:var(--muted)] sm:rounded-[1.5rem]">
              내 브라우저 저장 글 {localPosts.length}개
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-[color:var(--muted)]">
          {createEntry.hint}
        </p>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3 rounded-[1.5rem] border border-white/65 bg-white/72 p-3 sm:gap-4 sm:rounded-[1.8rem] sm:p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field"
                placeholder="제목, 요약, 역할, 기술 스택으로 검색해보세요"
              />
              <select
                value={campus}
                onChange={(event) => setCampus(event.target.value)}
                className="field md:min-w-[190px]"
              >
                {campusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "전체 캠퍼스" : item}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold sm:px-4 ${
                    category === item.value
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200/80 bg-white/84 text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
            {[
              { label: "전체 모집글", value: merged.length },
              { label: "현재 필터 결과", value: filtered.length },
              { label: "스포트라이트", value: highlighted.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.2rem] border border-white/65 bg-white/78 p-3 sm:rounded-[1.5rem] sm:p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {item.label}
                </p>
                <p className="display mt-2 text-2xl text-slate-950 sm:mt-3 sm:text-3xl">
                  {item.value.toString().padStart(2, "0")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {highlighted.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="eyebrow">Highlight Picks</span>
              <h2 className="mt-3 display text-3xl text-slate-950">
                지금 주목받는 추천 모집글
              </h2>
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
            {highlighted.map((post) => (
              <PostCard key={post.slug} post={post} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="eyebrow">All Posts</span>
            <h2 className="mt-3 display text-3xl text-slate-950">
              {highlighted.length > 0 ? "추천 외에 더 볼 모집글" : "조건에 맞는 모집글"}
            </h2>
          </div>
        </div>
        {remainingPosts.length > 0 ? (
          <div className="grid gap-3 sm:gap-5 lg:grid-cols-3">
            {remainingPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : filtered.length > 0 && highlighted.length > 0 ? (
          <div className="panel-strong rounded-[1.6rem] px-5 py-8 text-center sm:rounded-[1.8rem] sm:px-6 sm:py-10">
            <p className="display text-2xl text-slate-950">
              현재 조건에서는 추천 모집글이 먼저 보입니다.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
              중복 카드는 숨겨두었습니다. 검색어나 필터를 조금 넓히면 다른
              모집글도 바로 이어서 볼 수 있습니다.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="button-secondary mt-6"
              >
                필터 초기화
              </button>
            ) : null}
          </div>
        ) : (
          <div className="panel-strong rounded-[1.6rem] px-5 py-8 text-center sm:rounded-[1.8rem] sm:px-6 sm:py-10">
            <p className="display text-2xl text-slate-950">
              조건에 맞는 모집글이 아직 없습니다.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
              검색어를 바꾸거나 새 모집글을 작성해 새로운 팀을 만들어보세요.
            </p>
            <Link href={createEntry.href} className="button-primary mt-6">
              {createEntry.emptyStateLabel}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
