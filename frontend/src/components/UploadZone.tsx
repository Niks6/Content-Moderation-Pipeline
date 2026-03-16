import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface UploadZoneProps {
  disabled: boolean;
  progress: number;
  onFileSelected: (file: File) => void;
}

const ACCEPT = [".mp4", ".mov", ".avi", ".webm"].join(",");
const MAX_BYTES = 500 * 1024 * 1024;

const formatSize = (size: number): string => {
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

export default function UploadZone({ disabled, progress, onFileSelected }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDurationSec(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      setDurationSec(video.duration || null);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const durationLabel = useMemo(() => {
    if (!durationSec || Number.isNaN(durationSec)) return "Unknown";
    const minutes = Math.floor(durationSec / 60);
    const seconds = Math.round(durationSec % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [durationSec]);

  const validate = (selected: File): boolean => {
    const extension = selected.name.toLowerCase().split(".").pop() ?? "";
    if (!["mp4", "mov", "avi", "webm"].includes(extension)) {
      setError("Unsupported format. Use mp4, mov, avi, or webm.");
      return false;
    }
    if (selected.size > MAX_BYTES) {
      setError("File exceeds 500 MB limit.");
      return false;
    }
    setError(null);
    return true;
  };

  const processFile = (selected: File) => {
    if (!validate(selected)) return;
    setFile(selected);
    onFileSelected(selected);
  };

  const dropZoneClass = dragging
    ? "upload-dragging border-2 border-dashed"
    : disabled
    ? "border-2 border-dashed border-white/10 opacity-60 cursor-not-allowed"
    : "upload-idle border-2 border-dashed cursor-pointer";

  return (
    <section className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-slate-200">Upload Video</h3>
        <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/30">
          mp4 · mov · avi · webm
        </span>
      </div>

      {/* Drop target */}
      <button
        type="button"
        id="upload-zone-btn"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) processFile(dropped);
        }}
        className={`w-full rounded-xl p-10 text-center transition-all duration-300 ${dropZoneClass}`}
      >
        {/* Animated icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/25 transition-transform duration-300 group-hover:scale-110">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
            <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 17.5A2.5 2.5 0 007 20h10a2.5 2.5 0 002.5-2.5" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-base font-semibold text-slate-200">
          {dragging ? "Release to analyze" : "Drag & drop or click to select"}
        </p>
        <p className="mt-1 text-xs text-slate-500">Max file size: 500 MB</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        id="upload-file-input"
        accept={ACCEPT}
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const selected = event.target.files?.[0];
          if (selected) processFile(selected);
        }}
      />

      {error ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 flex-shrink-0">
            <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm7.25-3.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 8a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : null}

      {/* File metadata chip */}
      {file ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M4 3h7l5 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M11 3v5h5" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-200">{file.name}</p>
            <p className="text-xs text-slate-500">
              {formatSize(file.size)} &nbsp;·&nbsp; Duration: ~{durationLabel}
            </p>
          </div>
        </div>
      ) : null}

      {/* Upload progress */}
      {disabled ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Uploading…</span>
            <span className="font-semibold text-violet-300">{progress}%</span>
          </div>
          <div className="progress-track h-2">
            <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
