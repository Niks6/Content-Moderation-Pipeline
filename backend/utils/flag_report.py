from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

SEVERITY_ORDER = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}


def _max_severity(stage_results: list[dict[str, Any]]) -> str:
    max_level = "Low"
    for stage in stage_results:
        sev = stage.get("severity") or "Low"
        if SEVERITY_ORDER.get(sev, 1) > SEVERITY_ORDER.get(max_level, 1):
            max_level = sev
    return max_level


def _recommended_action(severity: str) -> str:
    if severity == "Critical":
        return "Auto-Reject"
    if severity == "High":
        return "Human-Review-Queue"
    if severity == "Medium":
        return "Auto-Hold"
    return "Allow"


def generate_flag_report(
    stage_results: list[dict[str, Any]],
    *,
    video_id: str,
    filename: str,
    processing_time_ms: int,
) -> dict[str, Any]:
    """Generate a FlagReport JSON payload matching the frontend TypeScript schema."""
    overall = _max_severity(stage_results)
    return {
        "videoId": video_id,
        "filename": filename,
        "processedAt": datetime.now(timezone.utc).isoformat(),
        "overallSeverity": overall,
        "recommendedAction": _recommended_action(overall),
        "stages": stage_results,
        "processingTimeMs": processing_time_ms,
    }
