import type { FlagReport as FlagReportType } from "../types";
import { sendToReviewQueue } from "../api/safestream";
import SeverityBadge from "./SeverityBadge";
import { useState } from "react";

interface FlagReportProps {
  report: FlagReportType | null;
}

const actionConfig: Record<
  FlagReportType["recommendedAction"],
  { card: string; label: string; icon: string }
> = {
  Allow: {
    card: "border-emerald-500/40 bg-emerald-500/[0.07]",
    label: "text-emerald-200",
    icon: "✅",
  },
  "Auto-Hold": {
    card: "border-amber-500/40 bg-amber-500/[0.07]",
    label: "text-amber-200",
    icon: "⏸️",
  },
  "Human-Review-Queue": {
    card: "border-orange-500/40 bg-orange-500/[0.07]",
    label: "text-orange-200",
    icon: "👁️",
  },
  "Auto-Reject": {
    card: "border-rose-500/40 bg-rose-500/[0.09]",
    label: "text-rose-200",
    icon: "🚫",
  },
};

export default function FlagReport({ report }: FlagReportProps) {
  const [queueStatus, setQueueStatus] = useState<string>("");
  const [sending, setSending] = useState(false);

  if (!report) {
    return (
      <section className="glass-card h-full rounded-2xl p-5">
        <h3 className="font-display mb-5 text-sm font-semibold text-slate-200">
          Moderation Report
        </h3>
        <div className="space-y-3">
          <div className="skeleton h-28 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          Submit a video to generate a report
        </p>
      </section>
    );
  }

  const actionCfg = actionConfig[report.recommendedAction];

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${report.videoId}-moderation-report.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const pushToReview = async () => {
    setSending(true);
    try {
      const result = await sendToReviewQueue(report);
      setQueueStatus(`✓ Queued: ${result.id}`);
    } catch {
      setQueueStatus("Failed to enqueue review");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="glass-card h-full rounded-2xl p-5 fade-up">
      <h3 className="font-display mb-4 text-sm font-semibold text-slate-200">
        Moderation Report
      </h3>

      {/* Verdict card */}
      <article className={`mb-5 rounded-xl border p-4 ${actionCfg.card}`}>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-slate-400">
          Pipeline Verdict
        </p>
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{actionCfg.icon}</span>
          <div>
            <p className={`text-xl font-bold leading-tight ${actionCfg.label}`}>
              {report.recommendedAction}
            </p>
            <div className="mt-1.5">
              <SeverityBadge severity={report.overallSeverity} />
            </div>
          </div>
        </div>
      </article>

      {/* Metadata grid */}
      <div className="mb-5 grid grid-cols-2 gap-2 text-xs">
        {[
          { label: "Filename", value: report.filename },
          { label: "Processed", value: new Date(report.processedAt).toLocaleString() },
          { label: "Video ID", value: report.videoId.slice(0, 12) + "…" },
          { label: "Processing", value: `${report.processingTimeMs} ms` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5"
          >
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
            <p className="truncate font-medium text-slate-300">{value}</p>
          </div>
        ))}
      </div>

      {/* Stage details */}
      <div className="mb-5 space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
          Stage Results
        </p>
        {report.stages.map((stage) => (
          <details
            key={stage.stageNumber}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all duration-200 hover:border-violet-500/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${stage.flagged ? "bg-rose-400" : "bg-emerald-400"}`}
                />
                <span>
                  Stage {stage.stageNumber}: {stage.stageName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                    stage.flagged
                      ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
                      : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                  }`}
                >
                  {stage.flagged ? "Flagged" : "Clean"}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </summary>

            <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-slate-300">
              <div className="rounded-lg bg-white/[0.02] p-2">
                <p className="mb-1 text-[10px] text-slate-500">Severity</p>
                <SeverityBadge severity={stage.severity ?? "Low"} />
              </div>
              <div className="rounded-lg bg-white/[0.02] p-2">
                <p className="mb-1 text-[10px] text-slate-500">Confidence</p>
                <p className="font-semibold text-slate-200">{(stage.confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-white/[0.02] p-2">
                <p className="mb-1 text-[10px] text-slate-500">Category</p>
                <p className="font-medium">{stage.category ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-white/[0.02] p-2">
                <p className="mb-1 text-[10px] text-slate-500">Timestamp</p>
                <p className="font-medium">{stage.timestamp ?? "—"}</p>
              </div>
              {stage.snippet ? (
                <div className="col-span-2 rounded-lg bg-white/[0.02] p-2">
                  <p className="mb-1 text-[10px] text-slate-500">Evidence</p>
                  <p className="leading-relaxed text-slate-300">{stage.snippet}</p>
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          id="download-report-btn"
          type="button"
          onClick={downloadReport}
          className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-all duration-200 hover:bg-violet-500/20 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] active:scale-95"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download JSON
        </button>
        <button
          id="send-review-btn"
          type="button"
          onClick={pushToReview}
          disabled={sending}
          className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-200 transition-all duration-200 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] active:scale-95 disabled:opacity-50"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {sending ? "Sending…" : "Human Review"}
        </button>
      </div>

      {queueStatus ? (
        <p className={`mt-3 text-xs ${queueStatus.startsWith("✓") ? "text-emerald-400" : "text-rose-400"}`}>
          {queueStatus}
        </p>
      ) : null}
    </section>
  );
}
