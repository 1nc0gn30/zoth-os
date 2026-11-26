"""Comprehensive offline tests for Anderson Security Sentinel v2.6.0:
ASGI LoopbackSecurityMiddleware, CSRF, Host/Origin spoofs, streaming 128 KiB body cap,
symlink path traversal, HTML dossier XSS escaping, Settings bounds & SSRF defense,
vision_mode alias/validation, HEAD /health, offline /docs, engine fixes, 4-tool stdio MCP, and CLI/TUI.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parent.parent


class _FakeCamera:
    fps_actual = 0.0

    def start(self):
        pass

    def stop(self):
        pass

    def get_frame(self):
        return None

    def is_active(self):
        return False


class _FakeDetector:
    def __init__(self):
        self.enrolled_embeddings = []

    def clear_enrolled_faces(self):
        self.enrolled_embeddings = []
        return True, "Enrolled faces cleared."


class _FakeCameraScanner:
    def get_summary(self):
        return {"total_cameras": 0, "high_proximity_count": 0, "cameras": []}


class _FakeWifiXray:
    def __init__(self):
        self.running = True
        self.scan_interval = 3.0
        self.path_loss_n = 2.6
        self.camera_scanner = _FakeCameraScanner()
        self.building_perimeter = {
            "footprint_sqm": 120.0,
            "building_width_m": 12.0,
            "building_length_m": 10.0,
            "estimated_partitions": 2,
        }
        self.calibrated = []

    def add_callback(self, cb):
        pass

    def start(self):
        pass

    def stop(self):
        pass

    def trigger_scan_now(self):
        pass

    def calibrate_optical_ground_truth(self, x, y, z):
        self.calibrated.append((x, y, z))

    def get_state_snapshot(self):
        return {
            "active": True,
            "total_nodes": 2,
            "disturbance_index": 1.5,
            "room_bounds": {"width_m": 8.0, "length_m": 6.0},
            "tomography_grid": [[0.1, 0.2], [0.0, 0.3]],
            "building_perimeter": self.building_perimeter,
            "cameras": [],
            "nodes": [
                {"ssid": "TEST-AP", "bssid": "AA:BB:CC:11:22:33", "rssi_dbm": -55, "signal_pct": 80, "band": "5GHz", "channel": 36, "distance_m": 3.2}
            ],
        }


class _FakeUsbGuard:
    def __init__(self):
        self.reset_calls = 0

    def add_callback(self, cb):
        pass

    def start(self):
        pass

    def stop(self):
        pass

    def reset_baseline(self):
        self.reset_calls += 1

    def get_status(self):
        return {"active": True, "trusted_count": 4, "breach_detected": False, "devices": []}


class _FakeBleGuard:
    def add_callback(self, cb):
        pass

    def start(self):
        pass

    def stop(self):
        pass

    def get_status(self):
        return {"active": True, "owner_present": False, "owner_device": None, "trusted_macs_count": 0, "total_devices": 0, "devices": []}


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    monkeypatch.setenv("ANDERSON_OFFLINE", "1")
    monkeypatch.setenv("ANDERSON_DISABLE_LOCKDOWN", "1")
    monkeypatch.delenv("ANDERSON_API_TOKEN", raising=False)

    from engine import config, sentinel as sentinel_mod
    from engine.forensic_dossier import ForensicDossierGenerator
    from engine.voice_synth import VoiceSynthesizer
    from web import server as web_server

    intruders = tmp_path / "intruders"
    intruders.mkdir(parents=True, exist_ok=True)
    settings_path = tmp_path / "settings.json"

    monkeypatch.setattr(config, "INTRUDERS_DIR", intruders)
    monkeypatch.setattr(config, "SETTINGS_FILE", str(settings_path))
    monkeypatch.setattr(web_server, "INTRUDERS_DIR", intruders)

    inst = object.__new__(sentinel_mod.AndersonSentinel)
    inst.settings = dict(config.DEFAULT_SETTINGS)
    inst.settings["armed"] = False
    inst.settings["tts_engine"] = "espeak"
    inst.detector = _FakeDetector()
    inst.camera = _FakeCamera()
    inst.synth = VoiceSynthesizer(settings=inst.settings, precache=False)
    inst.wifi_xray = _FakeWifiXray()
    inst.usb_guard = _FakeUsbGuard()
    inst.ble_guard = _FakeBleGuard()
    inst.dossier_gen = ForensicDossierGenerator(intruders)
    inst.vision_mode = "normal"
    inst.running = False
    inst.loop_thread = None
    inst.events = []
    inst.listeners = []
    inst.current_targets = []
    inst.security_status = "DISARMED"
    inst.last_processed_frame = None
    inst.last_hud_frame = None
    inst.lock = __import__("threading").Lock()
    inst.start = lambda: None
    inst.stop = lambda: None

    monkeypatch.setattr(web_server, "_sentinel_instance", inst)

    with TestClient(web_server.app, base_url="http://127.0.0.1:8103") as client:
        yield client, inst, intruders, tmp_path


# ---------------------------------------------------------------------------
# 1. LoopbackSecurityMiddleware: Host, Origin, CORS, CSRF, Token, Headers, Body Cap
# ---------------------------------------------------------------------------

def test_host_allowlist_blocks_dns_rebinding(api_client):
    client, *_ = api_client
    r1 = client.get("/health", headers={"Host": "evil.example:8103"})
    assert r1.status_code == 403
    assert "Host" in r1.json()["detail"]

    r2 = client.post("/api/disarm", headers={"Host": "evil.example:8103"})
    assert r2.status_code == 403

    r3 = client.get("/api/settings", headers={"Host": "127.0.0.1.evil.example:8103"})
    assert r3.status_code == 403


def test_origin_rejects_evil_and_port_suffix_spoofs(api_client):
    client, *_ = api_client
    for bad_origin in [
        "https://example.invalid",
        "http://127.0.0.1:8103.example.invalid",
        "http://localhost.evil.example:8103",
        "http://user@127.0.0.1:8103",
    ]:
        r_opt = client.options("/api/settings", headers={"Origin": bad_origin})
        assert r_opt.status_code == 403
        assert "access-control-allow-origin" not in r_opt.headers

        r_get = client.get("/health", headers={"Origin": bad_origin})
        assert r_get.status_code == 403
        assert "access-control-allow-origin" not in r_get.headers

        r_post = client.post("/api/disarm", headers={"Origin": bad_origin, "Content-Type": "text/plain"}, content="x")
        assert r_post.status_code == 403


def test_loopback_studio_origin_allowed_with_exact_acao_and_vary(api_client):
    client, *_ = api_client
    studio_origin = "http://127.0.0.1:3000"
    r_get = client.get("/health", headers={"Origin": studio_origin})
    assert r_get.status_code == 200
    assert r_get.headers.get("access-control-allow-origin") == studio_origin
    assert "Origin" in r_get.headers.get("vary", "")
    assert "access-control-allow-credentials" not in r_get.headers

    r_opt = client.options("/api/settings", headers={"Origin": studio_origin})
    assert r_opt.status_code == 204
    assert r_opt.headers.get("access-control-allow-origin") == studio_origin


def test_csrf_simple_text_plain_post_rejected(api_client):
    client, *_ = api_client
    r = client.post("/api/disarm", headers={"Content-Type": "text/plain"}, content="csrf")
    assert r.status_code == 403

    r_ref = client.post("/api/usb/baseline", headers={"Referer": "https://evil.example/pwn"})
    assert r_ref.status_code == 403


def test_optional_bearer_token_enforcement(api_client, monkeypatch):
    client, *_ = api_client
    monkeypatch.setenv("ANDERSON_API_TOKEN", "s3cr3t-loopback-token")

    r_missing = client.post("/api/disarm", headers={"Origin": "http://127.0.0.1:8103"})
    assert r_missing.status_code == 401

    r_wrong = client.post(
        "/api/disarm",
        headers={"Origin": "http://127.0.0.1:8103", "Authorization": "Bearer wrong-token"},
    )
    assert r_wrong.status_code == 401

    r_ok = client.post(
        "/api/disarm",
        headers={"Origin": "http://127.0.0.1:8103", "Authorization": "Bearer s3cr3t-loopback-token"},
    )
    assert r_ok.status_code == 200


def test_security_headers_present(api_client):
    client, *_ = api_client
    r = client.get("/health")
    assert r.status_code == 200
    assert r.headers.get("x-frame-options") == "SAMEORIGIN"
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "Origin" in r.headers.get("vary", "")


def test_streaming_max_body_bytes_413(api_client):
    client, *_ = api_client
    huge_payload = json.dumps({"welcome_phrase": "A" * 200_000}).encode("utf-8")
    r = client.post(
        "/api/settings",
        content=huge_payload,
        headers={"Content-Type": "application/json", "Origin": "http://127.0.0.1:8103"},
    )
    assert r.status_code == 413
    assert "Payload Too Large" in r.json()["detail"]


def test_websocket_rejects_evil_host_and_origin(api_client):
    client, *_ = api_client
    with pytest.raises(Exception):
        with client.websocket_connect("/ws", headers={"Host": "evil.example:8103"}):
            pass

    with pytest.raises(Exception):
        with client.websocket_connect("/ws", headers={"Host": "127.0.0.1:8103", "Origin": "https://example.invalid"}):
            pass

    with client.websocket_connect("/ws", headers={"Host": "127.0.0.1:8103", "Origin": "http://127.0.0.1:8103"}) as ws:
        init_msg = ws.receive_json()
        assert init_msg["type"] == "init"
        assert init_msg["data"]["version"] == "2.6.0"


# ---------------------------------------------------------------------------
# 2. Path Traversal / Symlink Escape, XSS, Settings Bounds & SSRF
# ---------------------------------------------------------------------------

def test_intruder_symlink_traversal_blocked(api_client):
    client, _, intruders, tmp_path = api_client
    canary = tmp_path / "secret_canary.txt"
    canary.write_text("CANARY_SECRET_DATA", encoding="utf-8")
    symlink = intruders / "sym_escape.jpg"
    symlink.symlink_to(canary)

    r_sym = client.get("/api/intruders/sym_escape.jpg")
    assert r_sym.status_code == 403
    assert "CANARY_SECRET_DATA" not in r_sym.text

    r_bad = client.get("/api/intruders/evil.txt")
    assert r_bad.status_code == 403

    valid = intruders / "intruder_valid.jpg"
    valid.write_bytes(b"\xff\xd8\xff\xe0VALIDJPEG")
    r_ok = client.get("/api/intruders/intruder_valid.jpg")
    assert r_ok.status_code == 200
    assert r_ok.content.startswith(b"\xff\xd8\xff")


def test_forensic_dossier_html_xss_escaped(api_client):
    client, inst, *_ = api_client
    xss_payload = '<img src=x onerror=alert(1)>'
    inst.events.insert(0, {
        "timestamp": "2026-11-26 05:00:00",
        "category": 'BREACH"><script>alert(2)</script>',
        "message": f"Rogue SSID {xss_payload}",
        "details": {},
    })
    r = client.get("/api/export_dossier_html")
    assert r.status_code == 200
    body = r.text
    assert xss_payload not in body
    assert "<script>alert(2)</script>" not in body
    assert "&lt;img src=x onerror=alert(1)&gt;" in body


def test_settings_validation_bounds_and_ssrf(api_client):
    client, *_ = api_client
    hdrs = {"Origin": "http://127.0.0.1:8103"}

    assert client.post("/api/settings", json={"wifi_scan_interval_sec": -5.0}, headers=hdrs).status_code == 422
    assert client.post("/api/settings", json={"similarity_threshold": 1.8}, headers=hdrs).status_code == 422
    assert client.post("/api/settings", json={"welcome_phrase": "x" * 300}, headers=hdrs).status_code == 422

    for bad_hook in [
        "http://169.254.169.254/latest/meta-data/",
        "https://127.0.0.1/hook",
        "https://192.168.1.10/hook",
        "https://10.0.0.1/hook",
        "http://discord.com/api/webhooks/123",
        "ftp://example.com/hook",
    ]:
        r = client.post("/api/settings", json={"webhook_url": bad_hook}, headers=hdrs)
        assert r.status_code == 422, f"Expected 422 for {bad_hook}, got {r.status_code}"

    r_ok = client.post("/api/settings", json={"webhook_url": "https://discord.com/api/webhooks/12345/abc"}, headers=hdrs)
    assert r_ok.status_code == 200


def test_vision_mode_optical_alias_and_invalid_422(api_client):
    client, *_ = api_client
    hdrs = {"Origin": "http://127.0.0.1:8103"}

    r_th = client.post("/api/vision_mode", json={"mode": "thermal"}, headers=hdrs)
    assert r_th.status_code == 200
    assert r_th.json()["mode"] == "thermal"

    r_opt = client.post("/api/vision_mode", json={"mode": "optical"}, headers=hdrs)
    assert r_opt.status_code == 200
    assert r_opt.json()["mode"] == "normal"

    r_bad = client.post("/api/vision_mode", json={"mode": "xray_fake"}, headers=hdrs)
    assert r_bad.status_code == 422


def test_head_health_and_zero_egress_offline_docs(api_client):
    client, *_ = api_client
    r_head = client.head("/health")
    assert r_head.status_code == 200
    assert r_head.content == b""

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["version"] == "2.6.0"

    r_docs = client.get("/docs")
    assert r_docs.status_code == 200
    assert "cdn.jsdelivr.net" not in r_docs.text
    assert "fonts.googleapis.com" not in r_docs.text
    assert "OPENAPI EXPLORER" in r_docs.text

    r_spec = client.get("/openapi.json")
    assert r_spec.status_code == 200
    assert r_spec.json()["info"]["version"] == "2.6.0"


# ---------------------------------------------------------------------------
# 3. Engine Runtime Fixes & Hygiene
# ---------------------------------------------------------------------------

def test_voice_synth_play_sfx_safe_and_no_profanity_or_personal_mac(monkeypatch):
    monkeypatch.setenv("ANDERSON_OFFLINE", "1")
    from engine.config import DEFAULT_SETTINGS
    from engine.voice_synth import VoiceSynthesizer

    assert DEFAULT_SETTINGS["trusted_bluetooth_macs"] == []
    assert "fuck" not in DEFAULT_SETTINGS["intruder_phrase"].lower()

    synth = VoiceSynthesizer(settings=DEFAULT_SETTINGS, precache=False)
    assert hasattr(synth, "play_sfx")
    assert synth.play_sfx("sonar_ping") is False  # offline no-op, zero AttributeError


def test_optical_to_rf_fusion_reads_box_key(api_client):
    _, inst, *_ = api_client
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    ok = inst._fuse_optical_to_rf([{"box": [220, 140, 120, 120]}], frame)
    assert ok is True
    assert len(inst.wifi_xray.calibrated) == 1


def test_hp_printer_oui_not_flagged_as_camera():
    from engine.surveillance_scanner import SurveillanceScanner
    scanner = SurveillanceScanner()
    vendor, is_cam = scanner.resolve_vendor("4a:ea:62:11:22:33")
    assert is_cam is False
    assert "Hewlett-Packard" in vendor

    cams = scanner.scan_rf_beacons_for_cameras([
        {"bssid": "4a:ea:62:11:22:33", "ssid": "DIRECT-HP-LaserJet", "distance_m": 2.0}
    ])
    assert cams == []


def test_camera_hud_renders_cleanly_at_640x480():
    from engine.detector import FaceSecurityEngine
    det = object.__new__(FaceSecurityEngine)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    out = det.draw_hud(frame, [], armed=True, vision_mode="thermal")
    assert out.shape == (480, 640, 3)


def test_bluetooth_guard_has_no_hardcoded_owner():
    from engine.bluetooth_scanner import BluetoothPerimeterGuard
    bg = BluetoothPerimeterGuard()
    assert bg.trusted_macs == set()


# ---------------------------------------------------------------------------
# 4. 4-Tool Stdio JSON-RPC 2.0 MCP Server & CLI / TUI
# ---------------------------------------------------------------------------

def test_mcp_server_jsonrpc_4_tools():
    from engine import mcp_server

    init_resp = mcp_server.handle_jsonrpc({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
    assert init_resp["result"]["serverInfo"]["version"] == "2.6.0"

    list_resp = mcp_server.handle_jsonrpc({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
    names = [t["name"] for t in list_resp["result"]["tools"]]
    assert names == ["sentinel_status", "sentinel_scan_rf", "sentinel_perimeter", "sentinel_dossier"]

    for idx, name in enumerate(names, start=10):
        call_resp = mcp_server.handle_jsonrpc({
            "jsonrpc": "2.0",
            "id": idx,
            "method": "tools/call",
            "params": {"name": name, "arguments": {"port": 19999}},  # guaranteed idle port -> offline fallback
        })
        assert call_resp["result"]["isError"] is False
        assert "structuredContent" in call_resp["result"]


def test_cli_and_tui_offline_commands():
    cli_bin = REPO_ROOT / "bin" / "anderson-security-sentinel"
    tui_bin = REPO_ROOT / "bin" / "anderson-security-sentinel-tui"

    r_ver = subprocess.run([sys.executable, str(cli_bin), "--version"], capture_output=True, text=True, check=True)
    assert "2.6.0" in r_ver.stdout

    r_json = subprocess.run(
        [sys.executable, str(cli_bin), "--json"],
        capture_output=True,
        text=True,
        env={**os.environ, "ANDERSON_PORT": "19999"},
        check=True,
    )
    payload = json.loads(r_json.stdout)
    assert payload["version"] == "2.6.0"
    assert payload["mcp_command"] == "anderson-security-sentinel mcp"

    r_mcp = subprocess.run(
        [sys.executable, str(cli_bin), "mcp"],
        input='{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n',
        capture_output=True,
        text=True,
        check=True,
    )
    mcp_out = json.loads(r_mcp.stdout.strip())
    assert len(mcp_out["result"]["tools"]) == 4

    r_tui = subprocess.run(
        [sys.executable, str(tui_bin), "--json", "--port", "19999"],
        capture_output=True,
        text=True,
        check=True,
    )
    tui_data = json.loads(r_tui.stdout)
    assert tui_data["version"] == "2.6.0"
    assert "rf_xray" in tui_data and "usb" in tui_data and "bluetooth" in tui_data
