from __future__ import annotations

import os
from typing import Any

try:
    import cv2  # type: ignore
except Exception:  # pragma: no cover
    cv2 = None

try:
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover
    np = None

try:
    import torch  # type: ignore
except Exception:  # pragma: no cover
    torch = None

try:
    from PIL import Image as PilImage  # type: ignore
except Exception:  # pragma: no cover
    PilImage = None

try:
    from transformers import EfficientNetImageProcessor  # type: ignore
except Exception:  # pragma: no cover
    EfficientNetImageProcessor = None

from models.efficientnet_deepfake import load_deepfake_model, load_deepfake_processor
from models.sensitive_image_cnn import SENSITIVE_CLASSES, load_sensitive_model
from utils.video_utils import sample_frames

try:
    from mtcnn import MTCNN  # type: ignore
except Exception:  # pragma: no cover
    MTCNN = None

try:
    from insightface.app import FaceAnalysis  # type: ignore
except Exception:  # pragma: no cover
    FaceAnalysis = None


DEVICE = "cuda" if (torch and torch.cuda.is_available()) else "cpu"
SENSITIVE_THRESHOLD = 0.75
DEEPFAKE_THRESHOLD = 0.75


class Stage3VisualPipeline:
    def __init__(self) -> None:
        if cv2 is None or torch is None:
            raise ImportError(
                "Stage 3 requires opencv-python and torch to be installed."
            )
        self.processor = load_deepfake_processor()  # shared HF processor for both models
        self.sensitive_model = load_sensitive_model(os.getenv("EFFICIENTNET_SENSITIVE_WEIGHTS"), device=DEVICE)
        self.deepfake_model = load_deepfake_model(os.getenv("EFFICIENTNET_DEEPFAKE_WEIGHTS"), device=DEVICE)
        self.face_detector = MTCNN() if MTCNN else None
        self.face_analysis = None
        if FaceAnalysis:
            try:
                self.face_analysis = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
                self.face_analysis.prepare(ctx_id=0, det_size=(640, 640))
            except Exception:
                self.face_analysis = None

    def _predict_sensitive(self, frame: np.ndarray) -> tuple[str, float]:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        inputs = self.processor(images=rgb, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            logits = self.sensitive_model(**inputs).logits
            probs = torch.softmax(logits, dim=1).squeeze(0)
        idx = int(torch.argmax(probs).item())
        return SENSITIVE_CLASSES[idx], float(probs[idx].item())

    def _predict_deepfake(self, frame: np.ndarray) -> dict[str, Any] | None:
        if self.face_detector is None:
            return None

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        x = y = w = h = 0
        face = None

        if self.face_analysis:
            faces = self.face_analysis.get(rgb)
            if faces:
                top = faces[0]
                bbox = [int(v) for v in top.bbox]
                x, y = max(0, bbox[0]), max(0, bbox[1])
                w, h = max(1, bbox[2] - bbox[0]), max(1, bbox[3] - bbox[1])
                face = rgb[y : y + h, x : x + w]

        if face is None:
            detections = self.face_detector.detect_faces(rgb)
            if not detections:
                return None
            top = detections[0]
            x, y, w, h = top["box"]
            x = max(0, x)
            y = max(0, y)
            face = rgb[y : y + max(1, h), x : x + max(1, w)]

        if face.size == 0:
            return None

        inputs = self.processor(images=face, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            logits = self.deepfake_model(**inputs).logits
            probs = torch.softmax(logits, dim=1).squeeze(0)

        fake_prob = float(probs[1].item())  # index 1 = "fake"
        return {
            "deepfake_probability": fake_prob,
            "bbox": [int(x), int(y), int(w), int(h)],
        }

    def run(self, video_path: str) -> dict[str, Any]:
        highest_sensitive = {"label": "safe", "confidence": 0.0, "timestamp": "0.00s"}
        highest_deepfake = {"probability": 0.0, "timestamp": "0.00s", "bbox": None}

        for _, timestamp, frame in sample_frames(video_path, interval_seconds=3.0):
            label, confidence = self._predict_sensitive(frame)
            if confidence > highest_sensitive["confidence"]:
                highest_sensitive = {
                    "label": label,
                    "confidence": confidence,
                    "timestamp": f"{timestamp:.2f}s",
                }

            deepfake = self._predict_deepfake(frame)
            if deepfake and deepfake["deepfake_probability"] > highest_deepfake["probability"]:
                highest_deepfake = {
                    "probability": deepfake["deepfake_probability"],
                    "timestamp": f"{timestamp:.2f}s",
                    "bbox": deepfake["bbox"],
                }

        flagged_sensitive = highest_sensitive["label"] != "safe" and highest_sensitive["confidence"] >= SENSITIVE_THRESHOLD
        flagged_deepfake = highest_deepfake["probability"] >= DEEPFAKE_THRESHOLD
        flagged = flagged_sensitive or flagged_deepfake

        severity = "Low"
        category = "explicit_content"
        snippet = f"Top class: {highest_sensitive['label']}"
        confidence = float(max(highest_sensitive["confidence"], highest_deepfake["probability"]))
        timestamp = highest_sensitive["timestamp"]

        if flagged_deepfake and highest_deepfake["probability"] >= 0.9:
            severity = "Critical"
            category = "deepfake"
            snippet = f"Deepfake probability {highest_deepfake['probability']:.2f} at frame bbox {highest_deepfake['bbox']}"
            timestamp = highest_deepfake["timestamp"]
        elif flagged_sensitive and highest_sensitive["confidence"] >= 0.9:
            severity = "High"
            category = "religious_provocation" if "religious" in highest_sensitive["label"] else "explicit_content"
            snippet = f"Sensitive class {highest_sensitive['label']} detected"
        elif flagged:
            severity = "Medium"
            category = "deepfake" if flagged_deepfake else "explicit_content"

        return {
            "stageNumber": 3,
            "stageName": "Visual & Deepfake Analysis (EfficientNet-B4)",
            "completed": True,
            "flagged": flagged,
            "severity": severity,
            "snippet": snippet,
            "timestamp": timestamp,
            "category": category,
            "confidence": round(confidence, 4),
        }


def run_stage3(video_path: str) -> dict[str, Any]:
    pipeline = Stage3VisualPipeline()
    return pipeline.run(video_path)
