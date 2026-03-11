import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/create-post-form";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

export default async function RecruitCreatePage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    redirect("/login?next=%2Frecruit%2Fnew");
  }

  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <span className="eyebrow">Create Flow</span>
            <h1 className="section-title text-slate-950">
              새 팀을 만들고
              <br />
              바로 발표하세요.
            </h1>
            <p className="section-subtitle">
          필수 항목만 입력해도 모집글이 생성됩니다. Phase 1 B에서 로그인과
          회원가입 진입이 연결되어 있어 인증 세션 후 이 페이지로 들어오게
          됩니다.
            </p>
            <div className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4 text-sm font-medium leading-7 text-[color:var(--muted)]">
              현재 세션: <span className="text-slate-900">{authContext.user.email}</span>
              {" · "}
              {authContext.onboarding.currentStep === "interests"
                ? "향후 설문 브랜치와 연결될 회원가입 직후 상태"
                : "향후 프로필 브랜치와 연결될 로그인 진입 상태"}
            </div>
            <div className="info-grid">
              {[
                "샘플 자동 입력으로 10초 안에 데모 가능",
                "생성 후 상세 화면으로 즉시 이동",
                "Vercel 배포 환경에서도 추가 설정 없이 동작",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4 text-sm font-medium leading-7 text-[color:var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <CreatePostForm
            currentUser={{
              id: authContext.user.id,
              displayName: authContext.user.displayName,
            }}
          />
        </div>
      </section>
    </div>
  );
}
