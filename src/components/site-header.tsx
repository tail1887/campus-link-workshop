import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

export async function SiteHeader() {
  const authContext = await getCurrentAuthContext();

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
              href="/recruit"
              className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
            >
              모집글 목록
            </Link>
            <Link
              href="/entry"
              className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
            >
              프로필 진입
            </Link>
            {authContext.authenticated && authContext.user.role === "student" ? (
              <>
                <Link
                  href="/profile/recruits"
                  className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
                >
                  내 모집 글
                </Link>
                <Link
                  href="/profile/applications"
                  className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
                >
                  내 참가 글
                </Link>
                <Link
                  href="/profile/communication"
                  className="text-sm font-semibold text-[color:var(--muted)] hover:text-slate-950"
                >
                  문의/알림
                </Link>
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            {authContext.authenticated ? (
              <>
                {authContext.user.role === "admin" ? (
                  <div className="hidden rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700 lg:block">
                    관리자 세션
                  </div>
                ) : null}
                <div className="hidden rounded-full border border-slate-200/80 bg-white/84 px-4 py-3 text-sm font-semibold text-slate-700 xl:block">
                  {authContext.user.email}
                </div>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="button-ghost px-4 py-3 text-sm">
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
