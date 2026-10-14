"""British narration via Kokoro MLX.

The import is optional. If it is missing, narration fails closed. This module
does not call a hosted voice and does not fall back to an American voice.
"""

from __future__ import annotations

from pathlib import Path

BRITISH_VOICES = {
    "bf_alice",
    "bf_emma",
    "bf_isabella",
    "bf_lily",
    "bm_daniel",
    "bm_fable",
    "bm_george",
    "bm_lewis",
}


def synthesize(text: str, voice: str, output: Path) -> None:
    if voice not in BRITISH_VOICES:
        raise RuntimeError(f"Voice {voice} is not a Kokoro British voice.")
    spoken = " ".join(text.split())
    if len(spoken) < 8:
        raise RuntimeError("Narration text is empty.")
    try:
        from kokoro_mlx import KokoroTTS
    except ImportError as error:
        raise RuntimeError(
            "British narration needs Kokoro MLX, which is not installed. No other voice is substituted."
        ) from error
    engine = KokoroTTS.from_pretrained()
    engine.save(spoken, str(output), voice=voice, sample_rate=48000)
