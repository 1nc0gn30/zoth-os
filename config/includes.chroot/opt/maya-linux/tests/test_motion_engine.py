#!/usr/bin/env python3
"""Unit tests for Maya Linux v2.0.0 motion engine clean-ISO fallbacks and CLI."""

import importlib.util
import json
import os
import re
import subprocess
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ENGINE_PATH = ROOT / "maya_motion_engine.py"


class TestMayaMotionEngine(unittest.TestCase):
    def test_zero_literal_home_paths(self):
        src = ENGINE_PATH.read_text(encoding="utf-8")
        self.assertIsNone(
            re.search(r"/home/[a-zA-Z0-9._-]+", src),
            "maya_motion_engine.py must not contain hardcoded /home/<user> paths",
        )
        self.assertNotIn("/tmp/maya_motion_wavs", src)

    def test_clean_iso_fallback_helpers(self):
        old_env = os.environ.pop("MAYA_VOICE_SCRIPTS_DIR", None)
        try:
            spec = importlib.util.spec_from_file_location("maya_motion_engine_iso", str(ENGINE_PATH))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            self.assertFalse(mod.HAS_VOICE_ENGINE)
            self.assertEqual(mod.clean_glyph_text("A — B • C"), "A - B · C")
            self.assertAlmostEqual(mod.smooth(0.5), 0.5)

            im = Image.new("RGBA", (640, 360), (8, 10, 18, 255))
            d = ImageDraw.Draw(im)
            fnt = mod.font(mod.BOLD, 22)
            fitted = mod.fit_font(d, "ZOTHOS SOVEREIGN MOTION TEST", mod.BOLD, 32, 12, 300)
            self.assertIsNotNone(fnt)
            self.assertIsNotNone(fitted)

            layout = mod.precompute_caption_layout(d, "Zero still frames live procedural motion engine", fnt, 280, max_lines_per_page=2)
            self.assertGreater(layout["total_words"], 0)
            mod.draw_karaoke_captions_fast(d, layout, 0.5, 20, 20, 300, 90, fnt, mod.GOLD, center_align=True)
            mod.draw_mic_icon(d, 40, 40, mod.CYAN, scale=1.0)

            bg = mod.build_background_music(0.5, root=138.59, seed=42, bpm=138, funky=True)
            self.assertGreater(len(bg), 1000)

            with tempfile.TemporaryDirectory(prefix="maya_test_") as td:
                wav_path = os.path.join(td, "test.wav")
                mod.save_wav(wav_path, bg)
                self.assertTrue(os.path.isfile(wav_path))
                self.assertGreater(os.path.getsize(wav_path), 1000)
        finally:
            if old_env is not None:
                os.environ["MAYA_VOICE_SCRIPTS_DIR"] = old_env

    def test_cli_flags(self):
        for cmd in (
            ["maya", "--help"],
            ["maya", "--version"],
            ["maya", "--status"],
            ["maya", "--status", "--json"],
            ["maya", "--list-presets"],
            ["maya", "--list-presets", "--json"],
        ):
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10, check=False)
            self.assertEqual(res.returncode, 0, f"{cmd} failed: {res.stderr}")
            self.assertIsNone(
                re.search(r"/home/[a-zA-Z0-9._-]+", res.stdout),
                f"{cmd} leaked literal /home/<user> path: {res.stdout}",
            )

        status_res = subprocess.run(["maya", "--status", "--json"], capture_output=True, text=True, timeout=10, check=True)
        data = json.loads(status_res.stdout)
        self.assertEqual(data["version"], "2.0.0")
        self.assertEqual(data["presetsCount"], 6)
        self.assertIn("Neal Frazier Tech", data["attribution"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
