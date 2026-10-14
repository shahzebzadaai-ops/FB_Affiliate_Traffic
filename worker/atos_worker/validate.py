"""Check a finished MP4 before the worker reports it."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


def probe(path: Path) -> dict:
    completed = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=codec_name,width,height",
            "-show_entries",
            "format=duration,size",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        shell=False,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def validate_mp4(path: Path, profile: str) -> dict:
    if profile not in {"technical", "production"}:
        raise ValueError("Unknown validation profile.")
    data = probe(path)
    video = next((stream for stream in data.get("streams", []) if stream.get("width")), None)
    if not video:
        raise ValueError("ffprobe did not find a video stream.")
    duration = float(data.get("format", {}).get("duration") or 0)
    width = int(video["width"])
    height = int(video["height"])
    if width != 1080 or height != 1920:
        raise ValueError(f"Expected 1080x1920 and got {width}x{height}.")
    if video.get("codec_name") != "h264":
        raise ValueError("Expected H.264.")
    if profile == "technical":
        if not 0.8 <= duration <= 8:
            raise ValueError(f"Technical check duration {duration:.2f}s is outside 0.8–8s.")
    elif not 30 <= duration <= 40:
        raise ValueError(f"Production Reel duration {duration:.2f}s is outside 30–40s.")
    return {
        "durationSeconds": round(duration, 3),
        "width": width,
        "height": height,
        "codec": video.get("codec_name"),
        "byteSize": path.stat().st_size,
    }
