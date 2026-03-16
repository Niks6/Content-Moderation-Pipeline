import { ReactNode } from "react";

interface StageCardProps {
  icon: ReactNode;
  name: string;
  description: string;
  status: "Pending" | "Running" | "Flagged" | "Clean";
  stageNumber: 1 | 2 | 3;
}

const statusConfig = {
  Pending: {
    card: "border-white/[0.06] bg-white/[0.02] text-slate-400",
    badge: "bg-slate-700/60 text-slate-400 ring-1 ring-slate-600/50",
    iconWrap: "bg-slate-800/60 text-slate-400",
    dot: "bg-slate-600",
    label: "Pending",
  },
  Running: {
    card: "border-violet-500/40 bg-violet-500/[0.06] text-violet-100 stage-running",
    badge: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40",
    iconWrap: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400 animate-pulse",
    label: "Running",
  },
  Flagged: {
    card: "border-rose-500/50 bg-rose-500/[0.08] text-rose-100 animate-shake",
    badge: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40",
    iconWrap: "bg-rose-500/15 text-rose-300",
    dot: "bg-rose-400",
    label: "Flagged",
  },
  Clean: {
    card: "border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-100",
    badge: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
    iconWrap: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
    label: "✓ Clean",
  },
};

export default function StageCard({
  icon,
  name,
  description,
  status,
  stageNumber,
}: StageCardProps) {
  const cfg = statusConfig[status];

  return (
    <article
      className={`rounded-xl border p-4 transition-all duration-300 ${cfg.card}`}
    >
      {/* Top row: icon + status badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.iconWrap}`}>
          {icon}
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Stage label */}
      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
        Stage {stageNumber}
      </p>
      <h4 className="text-sm font-semibold leading-tight">{name}</h4>
      <p className="mt-1 text-[11px] leading-relaxed opacity-60">{description}</p>
    </article>
  );
}
