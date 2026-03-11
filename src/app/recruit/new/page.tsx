import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/create-post-form";
import { getCurrentAuthContext } from "@/lib/server/auth-context";

export default async function RecruitCreatePage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.authenticated) {
    redirect("/login?next=%2Frecruit%2Fnew");
  }

  return (
    <div className="shell max-w-[1480px] space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-5 py-6 sm:px-7 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="eyebrow">Create Flow</span>
            <h1 className="section-title text-slate-950">모집글 작성</h1>
          </div>
          <div className="rounded-[1.2rem] border border-white/70 bg-white/72 px-4 py-3 text-sm font-medium leading-7 text-[color:var(--muted)]">
            현재 세션: <span className="text-slate-900">{authContext.user.email}</span>
          </div>
        </div>
        <div>
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
