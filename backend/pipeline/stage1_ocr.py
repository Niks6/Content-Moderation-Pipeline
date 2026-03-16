from __future__ import annotations

from typing import Any

from models.bert_classifier import BertRiskClassifier
from utils.video_utils import sample_frames

try:
    import easyocr  # type: ignore
except Exception:  # pragma: no cover
    easyocr = None

try:
    import spacy  # type: ignore
except Exception:  # pragma: no cover
    spacy = None


LANGS = ["en", "hi", "ur", "ta", "bn", "mr"]
LEXICON = {"hate", "riot", "attack", "burn", "kill", "lynch", "revenge"}


def _severity_from_score(score: float) -> str:
    if score >= 0.9:
        return "Critical"
    if score >= 0.75:
        return "High"
    if score >= 0.5:
        return "Medium"
    return "Low"


def run_stage1(video_path: str) -> dict[str, Any]:
    bert = BertRiskClassifier()
    reader = easyocr.Reader(LANGS, gpu=False) if easyocr else None
    nlp = spacy.blank("xx") if spacy else None

    best = {
        "flagged": False,
        "severity": "Low",
        "snippet": "",
        "timestamp": "0.00s",
        "category": "hate_speech",
        "confidence": 0.0,
    }

    for _, timestamp, frame in sample_frames(video_path, interval_seconds=2.0):
        if reader:
            extracted_lines = reader.readtext(frame, detail=0)
            text = " ".join(extracted_lines).strip()
        else:
            text = ""

        if not text:
            continue

        lowered = text.lower()
        if nlp:
            doc = nlp(lowered)
            tokens = [token.text for token in doc]
        else:
            tokens = lowered.split()

        lexicon_hit = any(token in LEXICON for token in tokens)
        bert_result = bert.predict(text)
        confidence = max(bert_result.score, 0.78 if lexicon_hit else 0.0)
        flagged = lexicon_hit or bert_result.flagged

        if confidence > best["confidence"]:
            best = {
                "flagged": flagged,
                "severity": _severity_from_score(confidence) if flagged else "Low",
                "snippet": bert_result.snippet or text[:180],
                "timestamp": f"{timestamp:.2f}s",
                "category": "hate_speech" if lexicon_hit else "incitement_to_violence",
                "confidence": round(confidence, 4),
            }

    return {
        "stageNumber": 1,
        "stageName": "OCR Text Detection",
        "completed": True,
        **best,
    }
