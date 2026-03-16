import type { ApiError, FlagReport, ProgressEvent } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const parseApiError = async (response: Response): Promise<ApiError> => {
  try {
    const data = (await response.json()) as ApiError;
    return {
      error: data.error ?? "Unknown API error",
      stage: typeof data.stage === "number" ? data.stage : null,
    };
  } catch {
    return {
      error: `Request failed with status ${response.status}`,
      stage: null,
    };
  }
};

export const analyzeVideo = async (
  file: File,
  videoId: string,
  onUploadProgress?: (progressPercent: number) => void,
): Promise<FlagReport> => {
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();

  return new Promise<FlagReport>((resolve, reject) => {
    xhr.open("POST", `${API_BASE_URL}/api/analyze?video_id=${encodeURIComponent(videoId)}`);

    xhr.upload.onprogress = (event) => {
      if (!onUploadProgress || !event.lengthComputable) {
        return;
      }
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onUploadProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as FlagReport);
        } catch {
          reject({ error: "Invalid response from server", stage: null } as ApiError);
        }
        return;
      }

      try {
        reject(JSON.parse(xhr.responseText) as ApiError);
      } catch {
        reject({ error: `Upload failed with status ${xhr.status}`, stage: null } as ApiError);
      }
    };

    xhr.onerror = () => {
      reject({ error: "Network error while uploading", stage: null } as ApiError);
    };

    xhr.send(formData);
  });
};

export const sendToReviewQueue = async (report: FlagReport): Promise<{ status: string; id: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/review-queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as { status: string; id: string };
};

export const checkHealth = async (): Promise<{ status: string; models_loaded: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as { status: string; models_loaded: boolean };
};

export const connectProgressSocket = (
  videoId: string,
  handlers: {
    onMessage: (event: ProgressEvent) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
    onClose?: () => void;
  },
): WebSocket => {
  const wsBase = API_BASE_URL.replace("http://", "ws://").replace("https://", "wss://");
  const socket = new WebSocket(`${wsBase}/ws/progress/${encodeURIComponent(videoId)}`);

  socket.onopen = () => {
    handlers.onOpen?.();
  };

  socket.onerror = (event) => {
    handlers.onError?.(event);
  };

  socket.onclose = () => {
    handlers.onClose?.();
  };

  socket.onmessage = (event) => {
    try {
      handlers.onMessage(JSON.parse(event.data) as ProgressEvent);
    } catch {
      // Ignore malformed ws messages to keep UI responsive.
    }
  };

  return socket;
};
