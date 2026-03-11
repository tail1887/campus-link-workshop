import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getAuthEntrySession } from "@/lib/auth-entry/branch-auth-entry-adapter";

export async function SiteHeader() {
  const session = await getAuthEntrySession();

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
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/recruit" className="button-secondary px-4 py-3 text-sm">
              둘러보기
            </Link>
            {session ? (
              <>
                <div className="hidden rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700 lg:block">
                  {session.mode === "signup" ? "회원가입 세션" : "로그인 세션"}
                </div>
                <div className="hidden rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700 xl:block">
                  {session.email}
                </div>
                <Link href="/recruit/new" className="button-primary px-4 py-3 text-sm">
                  글쓰기
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700">
                  로그인
                </Link>
                <Link href="/signup" className="button-primary px-4 py-3 text-sm">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
