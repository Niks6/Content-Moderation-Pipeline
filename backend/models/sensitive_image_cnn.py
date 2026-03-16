from __future__ import annotations

from pathlib import Path

import torch
from transformers import EfficientNetForImageClassification

HF_MODEL_ID = "google/efficientnet-b4"

SENSITIVE_CLASSES = ["safe", "religious_sensitive", "political_sensitive", "violent", "explicit"]
_ID2LABEL = {i: label for i, label in enumerate(SENSITIVE_CLASSES)}
_LABEL2ID = {label: i for i, label in enumerate(SENSITIVE_CLASSES)}


def load_sensitive_model(
    weights_path: str | None = None,
    device: str = "cpu",
) -> EfficientNetForImageClassification:
    """Load EfficientNet-B4 for 5-class sensitive content detection.

    Classes: safe | religious_sensitive | political_sensitive | violent | explicit
    When *weights_path* is provided and exists, the saved state-dict is loaded
    on top of the pre-trained backbone.
    """
    model = EfficientNetForImageClassification.from_pretrained(
        HF_MODEL_ID,
        num_labels=len(SENSITIVE_CLASSES),
        id2label=_ID2LABEL,
        label2id=_LABEL2ID,
        ignore_mismatched_sizes=True,  # replaces the 1000-class head
    )
    if weights_path:
        path = Path(weights_path)
        if path.exists():
            state = torch.load(path, map_location=device)
            model.load_state_dict(state)
    model.eval()
    return model.to(device)
