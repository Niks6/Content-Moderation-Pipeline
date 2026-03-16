from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Iterable

import cv2


def sample_frames(video_path: str, interval_seconds: float) -> Iterable[tuple[int, float, any]]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    step = max(1, int(fps * interval_seconds))
    frame_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if frame_index % step == 0:
            timestamp = frame_index / fps
            yield frame_index, timestamp, frame
        frame_index += 1

    cap.release()


def extract_audio_ffmpeg(video_path: str, output_wav_path: str) -> str:
    output = Path(output_wav_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-ac",
        "1",
        "-ar",
        "16000",
        str(output),
    ]
    subprocess.run(command, check=True, capture_output=True)
    return str(output)
