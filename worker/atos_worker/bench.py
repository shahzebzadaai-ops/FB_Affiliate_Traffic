"""Technical FFmpeg check. This is not a Page asset and not a Mac measurement."""

from __future__ import annotations

import hashlib
import platform
import resource
import shutil
import subprocess
import time
from pathlib import Path

from atos_worker.assemble import TECHNICAL_CAPTION, assemble_command, encoder_args, run_ffmpeg, write_srt
from atos_worker.validate import validate_mp4


def technical_check(output: Path) -> dict:
    output.parent.mkdir(parents=True, exist_ok=True)
    work = output.parent / "technical-src"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()
    started = time.perf_counter()
    frames = [work / "navy.png", work / "cream.png"]
    _still(frames[0], "0x1B3A4B")
    _still(frames[1], "0xF3EDE2")
    srt = work / "captions.ass"
    write_srt(srt, [TECHNICAL_CAPTION, "Linux or Mac encoder smoke. Not Still Got It."], 2.0)
    argv = assemble_command(frames, srt, output, frames_per_scene=30, narration=None)
    if any(TECHNICAL_CAPTION in part for part in argv):
        raise RuntimeError("Caption text leaked into the ffmpeg argument list.")
    run_ffmpeg(argv)
    info = validate_mp4(output, "technical")
    elapsed = time.perf_counter() - started
    temp_bytes = output.stat().st_size + sum(path.stat().st_size for path in work.rglob("*") if path.is_file())
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    shutil.rmtree(work)
    return {
        "label": "technical-check",
        "pageAsset": False,
        "macBenchmark": False,
        "host": platform.system(),
        "machine": platform.machine(),
        "encoder": encoder_args(),
        "sha256": digest,
        "durationSeconds": info["durationSeconds"],
        "width": info["width"],
        "height": info["height"],
        "byteSize": info["byteSize"],
        "renderSeconds": round(elapsed, 3),
        "peakRssBytes": _peak_rss_bytes(),
        "tempDiskBytes": temp_bytes,
        "externalApiCostCents": None,
        "externalApiCalled": False,
    }


def _still(path: Path, color: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:s=1080x1920:d=1", "-frames:v", "1", str(path)],
        check=True,
        shell=False,
        capture_output=True,
    )


def _peak_rss_bytes() -> int:
    rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    if platform.system() == "Linux":
        return int(rss) * 1024
    return int(rss)
