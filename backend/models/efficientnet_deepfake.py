from __future__ import annotations

from pathlib import Path

import torch
from transformers import EfficientNetForImageClassification, EfficientNetImageProcessor

HF_MODEL_ID = "google/efficientnet-b4"


def load_deepfake_model(
    weights_path: str | None = None,
    device: str = "cpu",
) -> EfficientNetForImageClassification:
    """Load EfficientNet-B4 for binary deepfake detection (real=0, fake=1).

    When *weights_path* is provided and exists, the saved state-dict is loaded
    on top of the pre-trained backbone.  Otherwise the model starts with
    ImageNet-pretrained weights and a randomly-initialised 2-class head.
    """
    model = EfficientNetForImageClassification.from_pretrained(
        HF_MODEL_ID,
        num_labels=2,
        id2label={0: "real", 1: "fake"},
        label2id={"real": 0, "fake": 1},
        ignore_mismatched_sizes=True,  # replaces the 1000-class head
    )
    if weights_path:
        path = Path(weights_path)
        if path.exists():
            state = torch.load(path, map_location=device)
            model.load_state_dict(state)
    model.eval()
    return model.to(device)


def load_deepfake_processor() -> EfficientNetImageProcessor:
    """Return the standard EfficientNet-B4 image processor."""
    return EfficientNetImageProcessor.from_pretrained(HF_MODEL_ID)
