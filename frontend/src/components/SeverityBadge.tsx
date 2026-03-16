import type { SeverityLevel } from "../types";

interface SeverityBadgeProps {
  severity: SeverityLevel;
}

const styles: Record<SeverityLevel, { color: string; label: string; dot: string }> = {
  Low: {
    color: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    dot: "bg-emerald-400",
    label: "Low",
  },
  Medium: {
    color: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30",
    dot: "bg-amber-400",
    label: "Medium",
  },
  High: {
    color: "bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/30",
    dot: "bg-orange-400",
    label: "High",
  },
  Critical: {
    color: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30 animate-criticalPulse",
    dot: "bg-rose-400",
    label: "Critical",
  },
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const style = styles[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
