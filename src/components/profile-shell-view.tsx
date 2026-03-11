import Link from "next/link";
import type { ProfileShellViewModel } from "@/lib/profile-shell/adapter";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { getVerificationStatusTone } from "@/lib/verification-ui";

type ProfileShellViewProps = {
  model: ProfileShellViewModel;
};

export function ProfileShellView({ model }: ProfileShellViewProps) {
  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">{model.badge}</span>
            <h1 className="section-title text-slate-950">{model.title}</h1>
            <p className="section-subtitle">{model.subtitle}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {model.verificationSummary ? (
              <Link
                href={model.verificationSummary.href}
                className="rounded-[1.4rem] border border-white/75 bg-white/85 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {model.verificationSummary.label}
                </p>
                <div className="mt-2">
                  <VerificationStatusBadge
                    label={model.verificationSummary.state}
                    tone={getVerificationStatusTone(model.verificationSummary.status)}
                  />
                </div>
              </Link>
            ) : null}
            <Link href={model.ctaHref} className="button-primary">
              {model.ctaLabel}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {model.summaryCards.map((item) => (
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
            Shell Checklist
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
            {model.checklist.map((item) => (
              <li key={item} className="rounded-[1.2rem] bg-white/82 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4">
          {model.modules.map((module) => {
            const content = (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    {module.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {module.description}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {module.state}
                </span>
              </div>
            );

            if (module.href) {
              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className="panel rounded-[1.8rem] p-5"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={module.title} className="panel rounded-[1.8rem] p-5">
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel rounded-[1.8rem] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Integration Notes
        </p>
        <div className="mt-4 grid gap-3">
          {model.notes.map((item) => (
            <div
              key={item}
              className="rounded-[1.2rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
