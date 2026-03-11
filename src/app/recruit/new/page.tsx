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
              바로 모집을 시작하세요.
            </h1>
            <p className="section-subtitle">
              필수 항목만 입력하면 바로 모집글을 게시할 수 있습니다. 로그인한
              사용자는 세션을 유지한 채 이 페이지에서 팀 정보를 등록할 수
              있습니다.
            </p>
            <div className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4 text-sm font-medium leading-7 text-[color:var(--muted)]">
              현재 세션: <span className="text-slate-900">{authContext.user.email}</span>
              {" · "}
              {authContext.onboarding.currentStep === "interests"
                ? "회원가입 후 기본 설정을 이어갈 수 있는 상태"
                : "기존 계정으로 바로 모집을 이어갈 수 있는 상태"}
            </div>
            <div className="info-grid">
              {[
                "예시 입력으로 빠르게 초안을 시작할 수 있습니다.",
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
