import type { VerificationBadgeTone } from "@/lib/verification-ui";

type VerificationStatusBadgeProps = {
  label: string;
  tone: VerificationBadgeTone;
};

const toneClassName: Record<VerificationBadgeTone, string> = {
  neutral:
    "border-slate-200/80 bg-white/86 text-slate-700",
  warning:
    "border-amber-200/80 bg-amber-50 text-amber-700",
  success:
    "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  danger:
    "border-rose-200/80 bg-rose-50 text-rose-700",
};

export function VerificationStatusBadge({
  label,
  tone,
}: VerificationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName[tone]}`}
    >
      {label}
    </span>
  );
}
