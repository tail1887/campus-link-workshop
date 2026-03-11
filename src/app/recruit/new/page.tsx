import { CreatePostForm } from "@/components/create-post-form";

export default function RecruitCreatePage() {
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
          필수 항목만 입력해도 모집글이 생성됩니다. 기본값은 mock 저장소
          fallback으로 동작하고, PostgreSQL 모드로 전환하면 서버 저장으로
          이어집니다.
            </p>
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
          <CreatePostForm />
        </div>
      </section>
    </div>
  );
}
