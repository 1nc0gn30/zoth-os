"""
Automated Test Suite for Zela Glasses Guide (`zela-glasses-guide`).
Verifies scene presets, mobile relay YAML configuration, and HTTP server endpoints (/health, /api/status, /api/presets, /api/config).
"""

from __future__ import annotations

import http.server
import json
import sys
import threading
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from server import CONFIG_YAML, SCENES, ZelaGuideHandler


def test_scenes_and_config_yaml_invariants():
    assert len(SCENES) == 6
    categories = {s["category"] for s in SCENES}
    assert categories == {"Repair", "Hardware", "Daily", "Security", "DevOps", "Mobility"}
    assert all(s["model"] == "moondream" for s in SCENES)
    assert "port: 8766" in CONFIG_YAML
    assert "kokoro-v1.0.onnx" in CONFIG_YAML
    assert "af_heart" in CONFIG_YAML


def test_http_endpoints_health_status_presets_and_config():
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), ZelaGuideHandler)
    port = httpd.server_port
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        # 1. GET /health
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=3) as resp:
            assert resp.status == 200
            health = json.loads(resp.read().decode("utf-8"))
            assert health["ok"] is True
            assert health["tool"] == "zela-glasses-guide"
            assert health["open_access"] is True

        # 2. GET /api/status
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=3) as resp:
            assert resp.status == 200
            status = json.loads(resp.read().decode("utf-8"))
            assert status["ok"] is True
            assert status["scenes_count"] == 6
            assert status["relay_port"] == 8766
            assert status["pricing"] == "100% Free & Open-Access"

        # 3. GET /api/presets
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/presets", timeout=3) as resp:
            assert resp.status == 200
            presets = json.loads(resp.read().decode("utf-8"))
            assert presets["ok"] is True
            assert len(presets["presets"]) == 6

        # 4. GET /api/config
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/config", timeout=3) as resp:
            assert resp.status == 200
            cfg = json.loads(resp.read().decode("utf-8"))
            assert cfg["ok"] is True
            assert "moondream" in cfg["yaml"]
    finally:
        httpd.shutdown()
        httpd.server_close()
