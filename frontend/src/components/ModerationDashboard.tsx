import { useMemo } from "react";
import type { StageResult, UploadState } from "../types";
import UploadZone from "./UploadZone";
import PipelineProgress from "./PipelineProgress";
import FlagReport from "./FlagReport";

interface ModerationDashboardProps {
  uploadState: UploadState;
  stageResults: StageResult[];
  queueOnline: boolean;
  onFileSelected: (file: File) => void;
}

export default function ModerationDashboard({
  uploadState,
  stageResults,
  queueOnline,
  onFileSelected,
}: ModerationDashboardProps) {
  const queueColor = useMemo(
    () => (queueOnline ? "bg-emerald-400" : "bg-amber-400"),
    [queueOnline],
  );
  const queueLabel = queueOnline ? "Pipeline Online" : "Pipeline Degraded";

  return (
    <div className="min-h-screen text-slate-100">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="glass sticky top-0 z-20 border-b border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 ring-1 ring-violet-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="#a78bfa" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(124,58,237,0.12)" />
                <path d="M9 12l2 2 4-4" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-violet-400 ring-1 ring-[#080a12]" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-white">
                Content Moderation Pipeline
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
                AI-Powered Video Guardrail
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-6 text-sm">
            <a
              href="#"
              className="text-slate-400 transition-colors duration-200 hover:text-violet-300"
            >
              Human Review Queue
            </a>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs backdrop-blur">
              <span className={`h-1.5 w-1.5 rounded-full ${queueColor} shadow-[0_0_6px_currentColor]`} />
              <span className="text-slate-300">{queueLabel}</span>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero tagline ──────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-8 pb-2 fade-up">
        <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
          Multi-Stage{" "}
          <span className="gradient-text">Content Moderation</span>
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-400">
          Upload a video to run it through OCR text detection, audio NLP, and visual deepfake analysis in a parallel AI pipeline.
        </p>
      </div>

      {/* ── Main grid ────────────────────────────────────── */}
      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Left column */}
        <section className="space-y-5">
          <UploadZone
            disabled={uploadState.status === "uploading" || uploadState.status === "processing"}
            progress={uploadState.progress}
            onFileSelected={onFileSelected}
          />

          <PipelineProgress
            currentStage={uploadState.currentStage}
            stageResults={stageResults}
            isProcessing={uploadState.status === "processing"}
          />

          {uploadState.error ? (
            <article className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 backdrop-blur fade-up">
              <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>{uploadState.error}</span>
            </article>
          ) : null}
        </section>

        {/* Right column */}
        <section className="fade-up">
          <FlagReport report={uploadState.report} />
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="mt-4 border-t border-white/[0.04] py-5 text-center text-xs text-slate-600">
        Content Moderation Pipeline &nbsp;·&nbsp; AI Video Guardrail System &nbsp;·&nbsp; 2026
      </footer>
    </div>
  );
}
