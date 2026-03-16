import type { StageResult } from "../types";
import StageCard from "./StageCard";

interface PipelineProgressProps {
  currentStage: 0 | 1 | 2 | 3;
  stageResults: StageResult[];
  isProcessing: boolean;
}

const STAGES = [
  {
    stageNumber: 1 as const,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M3 5h14M3 8h10M3 11h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="13" y="10" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M15 12v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    name: "OCR Text Detection",
    description: "Scans frames for embedded text",
  },
  {
    stageNumber: 2 as const,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M5 10h1l2-6 2 12 2-8 2 5 1-3h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="4" r="1.5" fill="currentColor" opacity=".5" />
      </svg>
    ),
    name: "Audio NLP",
    description: "Transcription & semantic analysis",
  },
  {
    stageNumber: 3 as const,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    name: "Visual & Deepfake",
    description: "EfficientNet-B4 frame analysis",
  },
];

export default function PipelineProgress({
  currentStage,
  stageResults,
  isProcessing,
}: PipelineProgressProps) {
  const byStage = new Map(stageResults.map((r) => [r.stageNumber, r]));

  const computeStatus = (n: 1 | 2 | 3): "Pending" | "Running" | "Flagged" | "Clean" => {
    const result = byStage.get(n);
    if (result?.completed) return result.flagged ? "Flagged" : "Clean";
    if (isProcessing && currentStage === n) return "Running";
    return "Pending";
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-slate-200">Pipeline Progress</h3>
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
          <span>Stage</span>
          <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-300 ring-1 ring-violet-500/25">
            {currentStage} / 3
          </span>
        </div>
      </div>

      {/* Stage cards with pipeline connectors */}
      <div className="flex items-stretch gap-0">
        {STAGES.map((stage, index) => {
          const status = computeStatus(stage.stageNumber);
          return (
            <div key={stage.stageNumber} className="flex flex-1 items-stretch">
              <div className="flex-1">
                <StageCard
                  icon={stage.icon}
                  name={stage.name}
                  description={stage.description}
                  status={status}
                  stageNumber={stage.stageNumber}
                />
              </div>
              {index < STAGES.length - 1 && (
                <div className="flex items-center px-1">
                  <div className="pipeline-connector" style={{ width: "28px", flex: "none" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
