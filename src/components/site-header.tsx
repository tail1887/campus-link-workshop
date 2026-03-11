import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="shell pt-4">
        <div className="panel flex items-center justify-between gap-4 rounded-[1.6rem] px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[1.1rem] bg-slate-950 text-sm font-bold text-white">
              CL
            </div>
            <div>
              <p className="display text-xl font-semibold text-slate-950">
                Campus Link
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                Study / Project Matching
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
            >
              메인
            </Link>
            <Link
              href="/recruit"
              className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
            >
              모집글 목록
            </Link>
            <Link
              href="/recruit/new"
              className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
            >
              글쓰기
            </Link>
            <Link
              href="/entry"
              className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
            >
              프로필 진입
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/recruit" className="button-secondary px-4 py-3 text-sm">
              둘러보기
            </Link>
            <Link href="/recruit/new" className="button-primary px-4 py-3 text-sm">
              시작하기
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
