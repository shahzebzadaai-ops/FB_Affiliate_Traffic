"""Outbound poller. The Mac opens HTTPS. Nothing listens on a public port."""

from __future__ import annotations

import hashlib
import json
import os
import platform
import resource
import shutil
import stat
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

from atos_worker.assemble import assemble_command, run_ffmpeg, write_srt
from atos_worker.safeguards import block_reason
from atos_worker.tts import synthesize
from atos_worker.validate import validate_mp4

POLL_SECONDS = 20


class WorkerClient:
    def __init__(self, base_url: str, token: str, work_dir: Path, asset_root: Path) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.work_dir = work_dir
        self.asset_root = asset_root
        self._rendering = False

    def poll_forever(self) -> None:
        while True:
            try:
                self.poll_once()
            except (urllib.error.URLError, TimeoutError, OSError):
                pass
            time.sleep(POLL_SECONDS)

    def poll_once(self) -> dict | None:
        if self._rendering:
            return None
        reason = block_reason(self.work_dir)
        if reason:
            self._post("/api/worker/v1/heartbeat", {"hostLabel": _host_label()})
            return None
        body = self._post("/api/worker/v1/poll", {"hostLabel": _host_label()})
        job = body.get("job")
        if not job:
            return None
        self._rendering = True
        try:
            self._render(job)
        finally:
            self._rendering = False
        return job

    def _render(self, job: dict) -> None:
        spec = job["spec"]
        job_id = job["id"]
        content_id = spec["contentId"]
        folder = self.work_dir / content_id
        folder.mkdir(parents=True, exist_ok=True)
        try:
            self._heartbeat(job_id, "ASSEMBLING")
            images = sorted((self.asset_root / content_id).glob("*.png"))
            if not images:
                raise RuntimeError("Original PNG scenes are not on this Mac. No stock library is queried.")
            if spec.get("music", {}).get("mode") != "none":
                raise RuntimeError("This job asked for music, and no licensed file is attached.")
            narration = folder / "narration.wav"
            supplied = self.asset_root / content_id / "narration.wav"
            if supplied.exists():
                narration.write_bytes(supplied.read_bytes())
            elif os.environ.get("ATOS_ENABLE_TTS") == "1":
                synthesize(" ".join(spec.get("narration") or []), spec["voice"], narration)
            else:
                raise RuntimeError("British narration is not available. Kokoro is disabled and no wav was supplied.")
            scenes = images[:6]
            frames_per_scene = round(32 * 30 / len(scenes))
            seconds = frames_per_scene * len(scenes) / 30
            lines = list(spec.get("narration") or [])
            srt = folder / "captions.ass"
            write_srt(srt, lines, seconds)
            output = folder / "reel.mp4"
            argv = assemble_command(scenes, srt, output, frames_per_scene=frames_per_scene, narration=narration)
            if any(line and line in part for line in lines for part in argv):
                raise RuntimeError("Narration leaked into the ffmpeg argument list.")
            started = time.perf_counter()
            caffeinate = _caffeinate()
            try:
                run_ffmpeg(argv)
            finally:
                if caffeinate and caffeinate.poll() is None:
                    caffeinate.terminate()
            info = validate_mp4(output, "production")
            render_seconds = round(time.perf_counter() - started, 3)
            for path in folder.iterdir():
                if path.name != "reel.mp4":
                    path.unlink(missing_ok=True)
            # Drive upload is not connected. Report no URL so the OS keeps the job off the operator queue.
            self._post(
                "/api/worker/v1/complete",
                {
                    "jobId": job_id,
                    "result": {
                        "sha256": _sha256(output),
                        "durationSeconds": info["durationSeconds"],
                        "width": 1080,
                        "height": 1920,
                        "byteSize": info["byteSize"],
                        "assetUrl": None,
                        "driveFileId": None,
                        "measurements": {
                            "renderSeconds": render_seconds,
                            "peakRssBytes": _peak_rss_bytes(),
                            "tempDiskBytes": info["byteSize"],
                            "externalApiCostCents": None,
                        },
                    },
                },
            )
        except Exception as error:
            message = str(error)[:400] or "The render failed."
            self._post("/api/worker/v1/fail", {"jobId": job_id, "error": message})

    def _heartbeat(self, job_id: str, phase: str) -> None:
        self._post("/api/worker/v1/heartbeat", {"jobId": job_id, "phase": phase, "hostLabel": _host_label()})

    def _post(self, path: str, payload: dict) -> dict:
        request = urllib.request.Request(
            self.base_url + path,
            data=json.dumps(payload).encode("utf-8"),
            headers={"authorization": f"Bearer {self.token}", "content-type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))


def load_token(path: Path) -> str:
    mode = path.stat().st_mode
    if mode & (stat.S_IRWXG | stat.S_IRWXO):
        raise PermissionError("The worker token file must be readable only by this user.")
    token = path.read_text(encoding="utf-8").strip()
    if len(token) < 20:
        raise ValueError("The worker token file is empty.")
    return token


def _host_label() -> str:
    return os.environ.get("ATOS_HOST_LABEL", "Mac M3 Pro")[:80]


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _peak_rss_bytes() -> int:
    rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    if platform.system() == "Linux":
        return int(rss) * 1024
    return int(rss)


def _caffeinate() -> subprocess.Popen[bytes] | None:
    if platform.system() != "Darwin" or not shutil.which("caffeinate"):
        return None
    return subprocess.Popen(["caffeinate", "-i", "-t", "900"])
