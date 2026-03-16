export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export type ViolationCategory =
  | "hate_speech"
  | "deepfake"
  | "religious_provocation"
  | "incitement_to_violence"
  | "explicit_content";

export type RecommendedAction = "Auto-Hold" | "Human-Review-Queue" | "Auto-Reject" | "Allow";

export interface StageResult {
  stageNumber: 1 | 2 | 3;
  stageName: string;
  completed: boolean;
  flagged: boolean;
  severity?: SeverityLevel;
  snippet?: string;
  timestamp?: string;
  category?: ViolationCategory;
  confidence: number;
}

export interface FlagReport {
  videoId: string;
  filename: string;
  processedAt: string;
  overallSeverity: SeverityLevel;
  recommendedAction: RecommendedAction;
  stages: StageResult[];
  processingTimeMs: number;
}

export interface UploadState {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  currentStage: 0 | 1 | 2 | 3;
  report: FlagReport | null;
  error: string | null;
}

export interface ApiError {
  error: string;
  stage: number | null;
}

export interface ProgressEvent {
  videoId: string;
  stage: 0 | 1 | 2 | 3;
  status: "started" | "running" | "completed" | "failed";
  message?: string;
  stageResult?: StageResult;
}
