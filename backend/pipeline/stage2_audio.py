from __future__ import annotations

import os
import tempfile
from typing import Any

from models.bert_classifier import BertRiskClassifier
from utils.video_utils import extract_audio_ffmpeg

try:
    import whisper  # type: ignore
except Exception:  # pragma: no cover
    whisper = None


def _severity_from_score(score: float) -> str:
    if score >= 0.9:
        return "Critical"
    if score >= 0.75:
        return "High"
    if score >= 0.5:
        return "Medium"
    return "Low"


def _google_fallback_stub(_audio_path: str) -> str:
    # Replace with Google Speech-to-Text integration in production.
    return ""


def run_stage2(video_path: str) -> dict[str, Any]:
    model_size = os.getenv("WHISPER_MODEL_SIZE", "medium")
    bert = BertRiskClassifier(os.getenv("BERT_MODEL_NAME", "bert-base-multilingual-cased"))

    transcript = ""
    with tempfile.TemporaryDirectory() as tmp_dir:
        audio_path = extract_audio_ffmpeg(video_path, os.path.join(tmp_dir, "audio.wav"))

        if whisper:
            try:
                model = whisper.load_model(model_size)
                result = model.transcribe(audio_path, task="transcribe")
                transcript = (result.get("text") or "").strip()
            except Exception:
                transcript = ""

        if not transcript:
            transcript = _google_fallback_stub(audio_path)

    nlp = bert.predict(transcript)
    flagged = nlp.flagged
    severity = _severity_from_score(nlp.score) if flagged else "Low"

    return {
        "stageNumber": 2,
        "stageName": "Audio Transcription & NLP",
        "completed": True,
        "flagged": flagged,
        "severity": severity,
        "snippet": nlp.snippet or transcript[:180],
        "timestamp": "0.00s",
        "category": "incitement_to_violence" if flagged else "hate_speech",
        "confidence": round(nlp.score, 4),
    }
