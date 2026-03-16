from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class BertRiskResult:
    flagged: bool
    score: float
    label: str
    snippet: str


class BertRiskClassifier:
    """Lightweight wrapper that can be replaced by a fine-tuned HF model in production."""

    def __init__(self, model_name: str = "bert-base-multilingual-cased") -> None:
        self.model_name = model_name
        self._lexicon = [
            "kill",
            "attack",
            "riot",
            "genocide",
            "hate",
            "bomb",
            "lynch",
            "violence",
            "terror",
        ]

    def predict(self, text: str) -> BertRiskResult:
        lowered = text.lower().strip()
        if not lowered:
            return BertRiskResult(flagged=False, score=0.02, label="safe", snippet="")

        for token in self._lexicon:
            if re.search(rf"\b{re.escape(token)}\b", lowered):
                snippet = self._extract_snippet(lowered, token)
                return BertRiskResult(flagged=True, score=0.88, label="incitement_to_violence", snippet=snippet)

        return BertRiskResult(flagged=False, score=0.18, label="safe", snippet=lowered[:120])

    @staticmethod
    def _extract_snippet(text: str, token: str, width: int = 45) -> str:
        idx = text.find(token)
        if idx == -1:
            return text[: width * 2]
        start = max(0, idx - width)
        end = min(len(text), idx + len(token) + width)
        return text[start:end]
