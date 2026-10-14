"""Refuse a heavy render when the laptop is short of memory, disk, or cool air."""

from __future__ import annotations

import platform
import shutil
import subprocess
from pathlib import Path

MIN_FREE_BYTES = 4 * 1024**3


def block_reason(work_dir: Path) -> str | None:
    work_dir.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage(work_dir).free < MIN_FREE_BYTES:
        return "Free disk is under 4 GB. The render waits."
    available = _available_memory()
    if available is not None and available < MIN_FREE_BYTES:
        return "Available memory is under 4 GB. The render waits."
    if _thermal_pressure():
        return "The Mac reports thermal pressure. The render waits."
    return None


def _available_memory() -> int | None:
    if platform.system() == "Linux":
        meminfo = Path("/proc/meminfo").read_text(encoding="utf-8")
        for line in meminfo.splitlines():
            if line.startswith("MemAvailable:"):
                return int(line.split()[1]) * 1024
        return None
    if platform.system() != "Darwin":
        return None
    completed = subprocess.run(["vm_stat"], check=False, shell=False, capture_output=True, text=True)
    if completed.returncode != 0:
        return None
    page = 16384
    free = 0
    for line in completed.stdout.splitlines():
        if "page size of" in line:
            digits = "".join(char for char in line if char.isdigit())
            page = int(digits or page)
        if line.startswith("Pages free") or line.startswith("Pages inactive"):
            digits = "".join(char for char in line if char.isdigit())
            free += int(digits or 0)
    return free * page


def _thermal_pressure() -> bool:
    if platform.system() != "Darwin" or not shutil.which("pmset"):
        return False
    completed = subprocess.run(["pmset", "-g", "therm"], check=False, shell=False, capture_output=True, text=True)
    text = completed.stdout.lower()
    return "serious" in text or "critical" in text
