import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeVideo, checkHealth, connectProgressSocket } from "./api/safestream";
import ModerationDashboard from "./components/ModerationDashboard";
import type { ProgressEvent, StageResult, UploadState } from "./types";

const initialState: UploadState = {
  status: "idle",
  progress: 0,
  currentStage: 0,
  report: null,
  error: null,
};

export default function App() {
  const [uploadState, setUploadState] = useState<UploadState>(initialState);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [queueOnline, setQueueOnline] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    checkHealth()
      .then((res) => setQueueOnline(res.status === "ok" && res.models_loaded))
      .catch(() => setQueueOnline(false));
  }, []);

  const onSocketMessage = (event: ProgressEvent) => {
    if (event.status === "running") {
      setUploadState((prev) => ({ ...prev, status: "processing", currentStage: event.stage }));
    }

    if (event.status === "completed" && event.stageResult) {
      setStageResults((prev) => {
        const rest = prev.filter((r) => r.stageNumber !== event.stageResult!.stageNumber);
        return [...rest, event.stageResult!].sort((a, b) => a.stageNumber - b.stageNumber);
      });
      setUploadState((prev) => ({ ...prev, currentStage: event.stage }));
    }

    if (event.status === "failed") {
      setUploadState((prev) => ({ ...prev, status: "error", error: event.message ?? "Stage execution failed" }));
    }
  };

  const handleFile = async (file: File) => {
    const videoId = crypto.randomUUID();

    setUploadState({
      status: "uploading",
      progress: 0,
      currentStage: 0,
      report: null,
      error: null,
    });
    setStageResults([]);

    socketRef.current?.close();
    socketRef.current = connectProgressSocket(videoId, {
      onMessage: onSocketMessage,
      onError: () => {
        setUploadState((prev) => ({ ...prev, error: "Progress socket disconnected" }));
      },
    });

    try {
      const report = await analyzeVideo(file, videoId, (pct) => {
        setUploadState((prev) => ({ ...prev, progress: pct }));
      });

      setUploadState((prev) => ({
        ...prev,
        status: "complete",
        progress: 100,
        currentStage: 3,
        report,
        error: null,
      }));

      setStageResults(report.stages);
    } catch (error) {
      const message = typeof error === "object" && error && "error" in error ? String(error.error) : "Upload failed";
      setUploadState((prev) => ({ ...prev, status: "error", error: message }));
    }
  };

  const sortedStages = useMemo(
    () => [...stageResults].sort((a, b) => a.stageNumber - b.stageNumber),
    [stageResults],
  );

  return (
    <ModerationDashboard
      uploadState={uploadState}
      stageResults={sortedStages}
      queueOnline={queueOnline}
      onFileSelected={handleFile}
    />
  );
}
