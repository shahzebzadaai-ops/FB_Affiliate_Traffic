import importlib.util
import platform
import tempfile
import unittest
from pathlib import Path

from atos_worker.assemble import TECHNICAL_CAPTION, assemble_command, encoder_args, write_srt
from atos_worker.bench import technical_check
from atos_worker.tts import synthesize
from atos_worker.validate import validate_mp4


class AssembleTests(unittest.TestCase):
    def test_encoder_matches_the_host(self) -> None:
        argv = encoder_args()
        if platform.system() == "Darwin":
            self.assertIn("h264_videotoolbox", argv)
        else:
            self.assertIn("libx264", argv)
            self.assertNotIn("h264_videotoolbox", argv)

    def test_caption_text_stays_in_the_srt(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            srt = folder / "captions.ass"
            line = "She had not been on a first date since 1998."
            write_srt(srt, [line], 2)
            argv = assemble_command(
                [folder / "scene.png"],
                srt,
                folder / "out.mp4",
                frames_per_scene=30,
                narration=None,
            )
            self.assertIsInstance(argv, list)
            self.assertEqual(argv[0], "ffmpeg")
            self.assertNotIn(line, "\n".join(argv))
            self.assertIn(line, srt.read_text(encoding="utf-8"))

    def test_kokoro_is_not_replaced(self) -> None:
        if importlib.util.find_spec("kokoro_mlx") is not None:
            self.skipTest("Kokoro is installed; this test must not download weights.")
        with tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(RuntimeError) as caught:
                synthesize("A short British line for the test.", "bf_emma", Path(raw) / "voice.wav")
        self.assertIn("not installed", str(caught.exception))

    def test_technical_check_is_1080x1920_and_not_a_page_asset(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            output = Path(raw) / "technical.mp4"
            report = technical_check(output)
            self.assertFalse(report["pageAsset"])
            self.assertFalse(report["macBenchmark"])
            self.assertIsNone(report["externalApiCostCents"])
            self.assertFalse(report["externalApiCalled"])
            self.assertGreater(report["renderSeconds"], 0)
            self.assertGreater(report["peakRssBytes"], 0)
            self.assertGreater(report["tempDiskBytes"], 0)
            info = validate_mp4(output, "technical")
            self.assertEqual(info["width"], 1080)
            self.assertEqual(info["height"], 1920)
            with self.assertRaises(ValueError):
                validate_mp4(output, "production")
            self.assertIn(TECHNICAL_CAPTION, "Technical check. Not a Page asset.")


if __name__ == "__main__":
    unittest.main()
