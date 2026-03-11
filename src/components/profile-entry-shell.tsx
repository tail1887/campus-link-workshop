import Link from "next/link";
import type { ProfileEntryViewModel } from "@/lib/profile-shell/adapter";

type ProfileEntryShellProps = {
  model: ProfileEntryViewModel;
};

export function ProfileEntryShell({ model }: ProfileEntryShellProps) {
  return (
    <div className="shell space-y-8 pb-8 pt-6">
      <section className="panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">{model.eyebrow}</span>
            <h1 className="section-title text-slate-950">{model.title}</h1>
            <p className="section-subtitle">{model.subtitle}</p>
          </div>
          <Link href={model.recommendedHref} className="button-primary">
            {model.recommendedLabel}
          </Link>
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

      <section className="grid gap-5 lg:grid-cols-3">
        {model.cards.map((card) => (
          <Link key={card.href} href={card.href} className="panel rounded-[1.8rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="eyebrow">{card.eyebrow}</span>
              <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                {card.state}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {card.description}
            </p>
          </Link>
        ))}
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
