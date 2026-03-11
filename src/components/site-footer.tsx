export function SiteFooter() {
  return (
    <footer className="shell pb-8 pt-8">
      <div className="panel rounded-[1.8rem] px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-lg font-semibold text-slate-950">
              Campus Link
            </p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              캠퍼스 스터디와 프로젝트 팀을 연결하는 매칭 플랫폼
            </p>
          </div>
          <div className="text-sm leading-7 text-[color:var(--muted)]">
            Next.js 16 · Tailwind CSS 4 · Vercel Ready
          </div>
        </div>
      </div>
    </footer>
  );
}
