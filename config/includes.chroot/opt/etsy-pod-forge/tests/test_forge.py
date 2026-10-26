"""Comprehensive Automated Test Suite for Etsy POD Forge.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Tests:
- 100% Etsy compliance invariants (titles <= 140 chars, 13 tags <= 20 chars).
- Canvas generator across all 5 cadres with DPI metadata.
- Mockup engine lifestyle compositing.
- 50+ Prompt Vault recipes.
- REST API endpoints and zip kit export.
"""

from __future__ import annotations

import io
import json
import os
import socket
import sys
import time
import unittest
import urllib.request
import zipfile

from PIL import Image

# Ensure src is on sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TEST_DIR)
SRC_DIR = os.path.join(REPO_ROOT, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from etsy_pod_forge.canvas_generator import CanvasGenerator, CanvasConfig
from etsy_pod_forge.listing_synthesizer import (
    synthesize_listing,
    sanitize_tags,
    clamp_title,
    ProfitMetrics,
    CADRE_SPECS,
)
from etsy_pod_forge.mockup_engine import MockupEngine, MockupConfig
from etsy_pod_forge.prompt_vault import (
    get_all_prompts,
    get_prompts_by_cadre,
    get_prompt_by_id,
    search_prompts,
)
from etsy_pod_forge.server import ForgeServer


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


class TestEtsyListingSynthesizer(unittest.TestCase):
    """Test Etsy SEO titles, 13 tags, copy, and profit calculations."""

    def test_all_cadres_satisfy_invariants(self):
        for cadre in CADRE_SPECS:
            kit = synthesize_listing(cadre)
            errors = kit.validate_invariants()
            self.assertEqual(errors, [], f"Cadre {cadre} failed invariants: {errors}")
            # Explicit checks
            self.assertLessEqual(len(kit.title), 140)
            self.assertEqual(len(kit.tags), 13)
            for tag in kit.tags:
                self.assertLessEqual(len(tag), 20, f"Tag '{tag}' exceeds 20 chars")
            self.assertGreater(kit.profit.retail_price, 0)
            self.assertGreater(kit.profit.net_profit, 0)
            self.assertGreater(kit.profit.margin_percent, 0)

    def test_custom_overrides(self):
        kit = synthesize_listing(
            cadre="apparel",
            custom_title_hook="Custom Gigi Garden Floral Hoodie",
            custom_names="Jack, Lily, Sam",
            retail_price=42.00,
            production_cost=14.00,
        )
        self.assertIn("Custom Gigi Garden Floral Hoodie", kit.title)
        self.assertLessEqual(len(kit.title), 140)
        self.assertEqual(kit.profit.retail_price, 42.00)
        self.assertEqual(kit.profit.production_cost, 14.00)
        self.assertIn("Jack, Lily, Sam", kit.description)

    def test_tag_sanitizer(self):
        raw = ["This tag is ridiculously too long to fit in twenty chars", "Short", "short", "Tag 3"]
        clean = sanitize_tags(raw)
        self.assertEqual(len(clean), 13)
        for t in clean:
            self.assertLessEqual(len(t), 20)
            self.assertEqual(t, t.lower())

    def test_clamp_title(self):
        long_title = "A" * 150
        clamped = clamp_title(long_title, 140)
        self.assertLessEqual(len(clamped), 140)

    def test_profit_calculation(self):
        # Retail 34.99, Prod 12.50
        # tx_fee = 34.99 * 0.065 = 2.27
        # proc_fee = 34.99 * 0.03 + 0.25 = 1.30
        # listing_fee = 0.20
        # total_fees = 3.77
        # net = 34.99 - (12.50 + 3.77) = 18.72
        metrics = ProfitMetrics.calculate(34.99, 12.50)
        self.assertEqual(metrics.net_profit, 18.72)
        self.assertEqual(metrics.margin_percent, 53.5)


class TestCanvasGenerator(unittest.TestCase):
    """Test print-ready canvas rendering across all 5 cadres."""

    def test_canvas_preview_rendering(self):
        for cadre in ["apparel", "mugs", "totes", "wall_art", "crafting"]:
            cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
            gen = CanvasGenerator(cfg)
            img = gen.generate()
            self.assertIsInstance(img, Image.Image)
            self.assertEqual(img.size, (cfg.width, cfg.height))
            self.assertEqual(img.mode, "RGBA")

            # Check bytes and base64
            raw_bytes = gen.generate_bytes()
            self.assertGreater(len(raw_bytes), 1000)
            b64 = gen.generate_base64()
            self.assertTrue(b64.startswith("data:image/png;base64,"))

    def test_master_dimensions_specification(self):
        apparel_cfg = CanvasConfig.default_for_cadre("apparel", preview=False)
        self.assertEqual(apparel_cfg.width, 4500)
        self.assertEqual(apparel_cfg.height, 5400)
        self.assertEqual(apparel_cfg.dpi, 300)

        mugs_cfg = CanvasConfig.default_for_cadre("mugs", preview=False)
        self.assertEqual(mugs_cfg.width, 2000)
        self.assertEqual(mugs_cfg.height, 2000)
        self.assertEqual(mugs_cfg.dpi, 300)

        totes_cfg = CanvasConfig.default_for_cadre("totes", preview=False)
        self.assertEqual(totes_cfg.width, 3600)
        self.assertEqual(totes_cfg.height, 3600)
        self.assertEqual(totes_cfg.dpi, 300)


class TestMockupEngine(unittest.TestCase):
    """Test realistic product mockup compositing."""

    def test_all_cadres_mockup_compositing(self):
        for cadre in ["apparel", "mugs", "totes", "wall_art", "crafting"]:
            cfg = MockupConfig.default_for_cadre(cadre)
            engine = MockupEngine(cfg)
            mockup = engine.composite()
            self.assertIsInstance(mockup, Image.Image)
            self.assertEqual(mockup.size, (cfg.width, cfg.height))
            self.assertEqual(mockup.mode, "RGB")

            # Test bytes and Base64 output
            raw_jpeg = engine.composite_bytes(format="JPEG")
            self.assertGreater(len(raw_jpeg), 5000)
            b64 = engine.composite_base64()
            self.assertTrue(b64.startswith("data:image/jpeg;base64,"))


class TestPromptVault(unittest.TestCase):
    """Test prompt recipe vault and filtering."""

    def test_prompt_count_requirement(self):
        prompts = get_all_prompts()
        self.assertGreaterEqual(len(prompts), 50, f"Found {len(prompts)} prompts, minimum is 50")

    def test_all_cadres_covered(self):
        for cadre in ["apparel", "mugs", "totes", "wall_art", "crafting"]:
            cadre_prompts = get_prompts_by_cadre(cadre)
            self.assertGreaterEqual(len(cadre_prompts), 10, f"Cadre {cadre} has fewer than 10 prompts")

    def test_search_and_get_by_id(self):
        res = search_prompts("wildflower")
        self.assertGreater(len(res), 0)
        p = get_prompt_by_id("apparel-01")
        self.assertIsNotNone(p)
        self.assertEqual(p.id, "apparel-01")
        full = p.full_prompt()
        self.assertIn("--ar", full)
        self.assertIn("--no", full)


class TestServerAndApiEndpoints(unittest.TestCase):
    """Test REST API server endpoints and packaging."""

    @classmethod
    def setUpClass(cls):
        cls.port = find_free_port()
        cls.public_dir = os.path.join(REPO_ROOT, "public")
        cls.server = ForgeServer(host="127.0.0.1", port=cls.port, public_dir=cls.public_dir)
        cls.server.start(block=False)
        time.sleep(0.5)

    @classmethod
    def tearDownClass(cls):
        cls.server.stop()

    def test_health_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/health"
        with urllib.request.urlopen(url, timeout=2.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "healthy")
            self.assertEqual(data["service"], "etsy-pod-forge")

    def test_stats_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/stats"
        with urllib.request.urlopen(url, timeout=2.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertIn("uptime_seconds", data)
            self.assertIn("canvases_generated", data)

    def test_cadres_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/cadres"
        with urllib.request.urlopen(url, timeout=2.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["count"], 5)
            self.assertIn("apparel", data["cadres"])

    def test_prompts_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/prompts?cadre=mugs"
        with urllib.request.urlopen(url, timeout=2.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertGreaterEqual(data["count"], 10)

    def test_generate_canvas_post(self):
        url = f"http://127.0.0.1:{self.port}/api/generate-canvas"
        payload = json.dumps({"cadre": "apparel", "preview": True, "title": "TEST GARDEN"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data["success"])
            self.assertTrue(data["image_b64"].startswith("data:image/png;base64,"))

    def test_generate_mockup_post(self):
        url = f"http://127.0.0.1:{self.port}/api/generate-mockup"
        payload = json.dumps({"cadre": "mugs", "color": "white"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data["success"])
            self.assertTrue(data["mockup_b64"].startswith("data:image/jpeg;base64,"))

    def test_generate_listing_post(self):
        url = f"http://127.0.0.1:{self.port}/api/generate-listing"
        payload = json.dumps({"cadre": "totes", "retail_price": 26.99}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data["success"])
            listing = data["listing"]
            self.assertLessEqual(len(listing["title"]), 140)
            self.assertEqual(len(listing["tags"]), 13)
            self.assertEqual(listing["profit"]["retail_price"], 26.99)

    def test_export_kit_zip(self):
        url = f"http://127.0.0.1:{self.port}/api/export-kit"
        payload = json.dumps({"cadre": "apparel", "title": "Grandma Garden"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            self.assertEqual(resp.status, 200)
            self.assertEqual(resp.headers.get("Content-Type"), "application/zip")
            zip_bytes = resp.read()
            zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
            namelist = zf.namelist()
            self.assertIn("apparel_print_canvas.png", namelist)
            self.assertIn("apparel_lifestyle_mockup.jpg", namelist)
            self.assertIn("listing_details.txt", namelist)
            self.assertIn("listing_data.json", namelist)


if __name__ == "__main__":
    unittest.main()
