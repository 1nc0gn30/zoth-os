import json
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

import server  # noqa: E402


def test_realities_catalog():
    assert len(server.REALITIES) == 5
    ids = [r["id"] for r in server.REALITIES]
    assert ids == ["gold", "emerald", "cyan", "crimson", "purple"]


def test_hex_to_rgb():
    assert server.hex_to_rgb("#D4AF37") == {"r": 212, "g": 175, "b": 55}
    assert server.hex_to_rgb("#10B981") == {"r": 16, "g": 185, "b": 129}
    assert server.hex_to_rgb("#05060A") == {"r": 5, "g": 6, "b": 10}


@pytest.mark.parametrize("reality_id", ["gold", "emerald", "cyan", "crimson", "purple"])
def test_compile_kde_colors(reality_id):
    out = server.compile_theme(reality_id, "kde")
    assert "[General]" in out
    assert f"ColorScheme=ZothOS-{reality_id}" in out
    assert "[Colors:Window]" in out
    assert "[Colors:Selection]" in out


@pytest.mark.parametrize("reality_id", ["gold", "emerald", "cyan", "crimson", "purple"])
def test_compile_alacritty_toml(reality_id):
    out = server.compile_theme(reality_id, "alacritty")
    assert "[colors.primary]" in out
    assert "[colors.cursor]" in out
    assert "[colors.normal]" in out
    assert out.endswith('"')


@pytest.mark.parametrize("reality_id", ["gold", "emerald", "cyan", "crimson", "purple"])
def test_compile_css_tokens(reality_id):
    out = server.compile_theme(reality_id, "css")
    assert ":root {" in out
    assert "--zoth-reality-primary:" in out
    assert "--zoth-reality-void:" in out


@pytest.mark.parametrize("reality_id", ["gold", "emerald", "cyan", "crimson", "purple"])
def test_compile_json_descriptor(reality_id):
    out = server.compile_theme(reality_id, "json")
    data = json.loads(out)
    assert data["schema"] == "zothos/reality/v3"
    assert data["id"] == reality_id
    assert "palette" in data


def test_cli_list_and_status():
    res_list = subprocess.run(
        ["reality-shader-forge", "--list", "--json"],
        capture_output=True,
        text=True,
        check=True,
    )
    data_list = json.loads(res_list.stdout)
    assert len(data_list) == 5
    assert "gold" in data_list and "emerald" in data_list

    res_status = subprocess.run(
        ["reality-shader-forge", "--status", "--json"],
        capture_output=True,
        text=True,
        check=True,
    )
    data_status = json.loads(res_status.stdout)
    assert data_status["status"] in ("ONLINE", "READY")


def test_http_server_endpoints():
    httpd = server.ThreadingTCPServer(("127.0.0.1", 0), server.RealityForgeHandler)
    port = httpd.server_address[1]
    httpd.port = port
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health") as resp:
            health = json.loads(resp.read().decode("utf-8"))
            assert health["status"] == "ok"
            assert health["service"] == "reality-shader-forge"

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/realities") as resp:
            realities = json.loads(resp.read().decode("utf-8"))
            assert len(realities["realities"]) == 5

        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/api/compile?reality=emerald&format=kde"
        ) as resp:
            kde_text = resp.read().decode("utf-8")
            assert "ColorScheme=ZothOS-emerald" in kde_text
    finally:
        httpd.shutdown()
        httpd.server_close()
