"""Assemble a vertical MP4 with FFmpeg.

Caption text is written to an SRT file. The process is started with an argument
list and shell=False. Brief text is never interpolated into a shell command.
"""

from __future__ import annotations

import platform
import subprocess
from pathlib import Path

TECHNICAL_CAPTION = "Technical check. Not a Page asset."


def encoder_args() -> list[str]:
    if platform.system() == "Darwin":
        return ["-c:v", "h264_videotoolbox", "-b:v", "6M", "-allow_sw", "1"]
    return ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"]


def escape_filter_path(path: Path) -> str:
    text = path.resolve().as_posix()
    return text.replace("\\", "\\\\").replace(":", "\\:").replace("'", r"\'")


def write_srt(path: Path, lines: list[str], seconds: float) -> None:
    """Write an ASS caption file. The text stays in the file, not in the ffmpeg shell."""
    clean = [_ass_text(line) for line in lines if line.strip()]
    if not clean:
        clean = [_ass_text(TECHNICAL_CAPTION)]
    step = seconds / len(clean)
    events = []
    for index, line in enumerate(clean):
        start = index * step
        end = seconds if index == len(clean) - 1 else (index + 1) * step
        events.append(f"Dialogue: 0,{_ass_stamp(start)},{_ass_stamp(end)},Caption,,0,0,0,,{line}")
    path.write_text(
        "\n".join(
            [
                "[Script Info]",
                "ScriptType: v4.00+",
                "PlayResX: 1080",
                "PlayResY: 1920",
                "WrapStyle: 0",
                "",
                "[V4+ Styles]",
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
                "Style: Caption,DejaVu Sans,92,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,3,0,0,2,80,80,280,1",
                "",
                "[Events]",
                "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
                *events,
                "",
            ]
        ),
        encoding="utf-8",
    )


def assemble_command(
    images: list[Path],
    srt_path: Path,
    output: Path,
    *,
    frames_per_scene: int,
    narration: Path | None,
) -> list[str]:
    if not images:
        raise ValueError("At least one original image is required.")
    if frames_per_scene < 15:
        raise ValueError("Each scene needs at least half a second at 30 fps.")
    filter_parts: list[str] = []
    inputs: list[str] = []
    for index, image in enumerate(images):
        inputs.extend(["-i", str(image)])
        # Alternate a slow zoom and a slow pan. zoompan consumes one still.
        if index % 2 == 0:
            motion = (
                f"zoompan=z='min(1+0.0015*on,1.08)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'"
                f":d={frames_per_scene}:s=1080x1920:fps=30"
            )
        else:
            motion = (
                f"zoompan=z='1.06':x='(iw-iw/zoom)*on/{frames_per_scene}':y='(ih-ih/zoom)/2'"
                f":d={frames_per_scene}:s=1080x1920:fps=30"
            )
        filter_parts.append(
            f"[{index}:v]scale=1620:2880:force_original_aspect_ratio=increase,crop=1620:2880,{motion},setsar=1[v{index}]"
        )
    concat_inputs = "".join(f"[v{index}]" for index in range(len(images)))
    filter_parts.append(f"{concat_inputs}concat=n={len(images)}:v=1:a=0[vc]")
    filter_parts.append(f"[vc]subtitles='{escape_filter_path(srt_path)}'[vout]")
    audio_index = len(images)
    if narration:
        inputs.extend(["-i", str(narration)])
        audio = f"{audio_index}:a"
    else:
        inputs.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"])
        audio = f"{audio_index}:a"
    return [
        "ffmpeg",
        "-y",
        *inputs,
        "-filter_complex",
        ";".join(filter_parts),
        "-map",
        "[vout]",
        "-map",
        audio,
        "-shortest",
        *encoder_args(),
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        str(output),
    ]


def assemble_clips_command(clips: list[Path], srt_path: Path, output: Path) -> list[str]:
    """Join uploaded shots into one 9:16 file. Caption text stays in the subtitle file."""
    if not clips:
        raise ValueError("At least one clip is required.")
    inputs: list[str] = []
    filter_parts: list[str] = []
    for index, clip in enumerate(clips):
        inputs.extend(["-i", str(clip)])
        filter_parts.append(
            f"[{index}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[v{index}]"
        )
    concat_inputs = "".join(f"[v{index}]" for index in range(len(clips)))
    filter_parts.append(f"{concat_inputs}concat=n={len(clips)}:v=1:a=0[vc]")
    filter_parts.append(f"[vc]subtitles='{escape_filter_path(srt_path)}'[vout]")
    inputs.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"])
    return [
        "ffmpeg",
        "-y",
        *inputs,
        "-filter_complex",
        ";".join(filter_parts),
        "-map",
        "[vout]",
        "-map",
        f"{len(clips)}:a",
        "-shortest",
        *encoder_args(),
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        str(output),
    ]


def run_ffmpeg(argv: list[str]) -> None:
    if not argv or argv[0] != "ffmpeg":
        raise ValueError("Only ffmpeg may be started from the assembler.")
    if any(not isinstance(part, str) for part in argv):
        raise TypeError("ffmpeg arguments must be strings.")
    subprocess.run(argv, check=True, shell=False)


def _ass_text(line: str) -> str:
    return line.replace("\r", " ").replace("\n", " ").replace("{", "(").replace("}", ")").strip()


def _ass_stamp(seconds: float) -> str:
    whole = max(0, int(seconds * 100))
    hours, rem = divmod(whole, 360_000)
    minutes, rem = divmod(rem, 6_000)
    secs, centis = divmod(rem, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"
