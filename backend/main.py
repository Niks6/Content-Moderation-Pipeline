from __future__ import annotations

import os
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from utils.flag_report import generate_flag_report


load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


DEMO_MODE = _as_bool(os.getenv("DEMO_MODE", "false"))


@dataclass
class ApiError(Exception):
    message: str
    stage: int | None = None
    status_code: int = 400


class ProgressHub:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, video_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[video_id].append(websocket)

    def disconnect(self, video_id: str, websocket: WebSocket) -> None:
        if video_id in self._connections and websocket in self._connections[video_id]:
            self._connections[video_id].remove(websocket)

    async def emit(self, video_id: str, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for socket in self._connections.get(video_id, []):
            try:
                await socket.send_json(payload)
            except Exception:
                stale.append(socket)

        for socket in stale:
            self.disconnect(video_id, socket)


REVIEW_QUEUE: list[dict[str, Any]] = []
progress_hub = ProgressHub()

app = FastAPI(title="SafeStream AI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def api_error_handler(_, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message, "stage": exc.stage})


@app.exception_handler(HTTPException)
async def http_error_handler(_, exc: HTTPException) -> JSONResponse:
    stage = None
    if isinstance(exc.detail, dict):
        stage = exc.detail.get("stage")
        message = exc.detail.get("error", "Request failed")
    else:
        message = str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": message, "stage": stage})


@app.exception_handler(Exception)
async def unhandled_error_handler(_, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"error": f"Internal server error: {exc}", "stage": None})


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "models_loaded": True}


@app.websocket("/ws/progress/{video_id}")
async def progress_socket(websocket: WebSocket, video_id: str) -> None:
    await progress_hub.connect(video_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        progress_hub.disconnect(video_id, websocket)


def _demo_report(video_id: str, filename: str) -> dict[str, Any]:
    stages = [
        {
            "stageNumber": 1,
            "stageName": "OCR Text Detection",
            "completed": True,
            "flagged": True,
            "severity": "Medium",
            "snippet": "Detected phrase indicating targeted harassment in subtitle text.",
            "timestamp": "00:12",
            "category": "hate_speech",
            "confidence": 0.79,
        },
        {
            "stageNumber": 2,
            "stageName": "Audio Transcription & NLP",
            "completed": True,
            "flagged": False,
            "severity": "Low",
            "snippet": "No harmful transcript segments found.",
            "timestamp": "00:00",
            "category": "incitement_to_violence",
            "confidence": 0.22,
        },
        {
            "stageNumber": 3,
            "stageName": "Visual & Deepfake Analysis (EfficientNet-B4)",
            "completed": True,
            "flagged": True,
            "severity": "High",
            "snippet": "Deepfake probability 0.91 with manipulated face region.",
            "timestamp": "00:27",
            "category": "deepfake",
            "confidence": 0.91,
        },
    ]
    return generate_flag_report(stages, video_id=video_id, filename=filename, processing_time_ms=6800)


@app.post("/api/analyze")
async def analyze_video(file: UploadFile = File(...), video_id: str = Query(default_factory=lambda: str(uuid.uuid4()))) -> dict[str, Any]:
    if not file.filename:
        raise ApiError(message="Missing filename", stage=None, status_code=400)

    upload_dir = os.path.join(os.getcwd(), "tmp_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    video_path = os.path.join(upload_dir, f"{video_id}_{file.filename}")

    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())

    start = time.perf_counter()

    await progress_hub.emit(video_id, {"videoId": video_id, "stage": 0, "status": "started", "message": "Upload complete"})

    if DEMO_MODE:
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 1, "status": "completed", "message": "Demo stage 1 complete"})
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 2, "status": "completed", "message": "Demo stage 2 complete"})
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 3, "status": "completed", "message": "Demo stage 3 complete"})
        return _demo_report(video_id, file.filename)

    results: list[dict[str, Any]] = []

    try:
        from pipeline.stage1_ocr import run_stage1

        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 1, "status": "running"})
        stage1 = run_stage1(video_path)
        results.append(stage1)
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 1, "status": "completed", "stageResult": stage1})
    except Exception as exc:
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 1, "status": "failed", "message": str(exc)})
        raise ApiError(message=f"Stage 1 failed: {exc}", stage=1, status_code=500)

    try:
        from pipeline.stage2_audio import run_stage2

        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 2, "status": "running"})
        stage2 = run_stage2(video_path)
        results.append(stage2)
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 2, "status": "completed", "stageResult": stage2})
    except Exception as exc:
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 2, "status": "failed", "message": str(exc)})
        raise ApiError(message=f"Stage 2 failed: {exc}", stage=2, status_code=500)

    try:
        from pipeline.stage3_visual import run_stage3

        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 3, "status": "running"})
        stage3 = run_stage3(video_path)
        results.append(stage3)
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 3, "status": "completed", "stageResult": stage3})
    except Exception as exc:
        await progress_hub.emit(video_id, {"videoId": video_id, "stage": 3, "status": "failed", "message": str(exc)})
        raise ApiError(message=f"Stage 3 failed: {exc}", stage=3, status_code=500)

    total_ms = int((time.perf_counter() - start) * 1000)
    return generate_flag_report(results, video_id=video_id, filename=file.filename, processing_time_ms=total_ms)


@app.post("/api/review-queue")
async def review_queue(report: dict[str, Any]) -> dict[str, str]:
    item_id = str(uuid.uuid4())
    REVIEW_QUEUE.append({"id": item_id, "payload": report, "created_at": time.time()})
    return {"status": "queued", "id": item_id}
