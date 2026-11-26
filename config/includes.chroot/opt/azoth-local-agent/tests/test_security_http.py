"""Comprehensive HTTP security, protocol, containment, SSRF, MCP & fallback test suite for AZOTH v3.1.0."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

TEST_TOKEN = "azoth-test-session-token-9f8e7d6c5b4a"


@pytest.fixture(autouse=True)
def _set_test_token(monkeypatch):
    monkeypatch.setenv("AZOTH_API_TOKEN", TEST_TOKEN)


@pytest.fixture
def client():
    import web_ui
    return TestClient(web_ui.app, base_url="http://127.0.0.1:8136")


# =====================================================================
# 1. Host DNS Rebinding & CORS / Origin Allowlist
# =====================================================================

def test_host_dns_rebinding_rejected(client):
    r = client.get("/health", headers={"Host": "evil.example.invalid"})
    assert r.status_code == 403
    assert r.json()["ok"] is False

    r_ts = client.get("/health", headers={"Host": "zothos.tailb0828c.ts.net:8136"})
    assert r_ts.status_code == 403


def test_evil_and_port_suffix_origin_rejected(client):
    for bad_origin in [
        "https://example.invalid",
        "http://127.0.0.1:18136.example.invalid",
        "http://127.0.0.1:8136.evil.com",
        "http://user:pass@127.0.0.1:8136",
        "null",
    ]:
        r_get = client.get("/api/engines", headers={"Origin": bad_origin})
        assert r_get.status_code == 403, f"GET allowed bad origin {bad_origin}"
        assert "access-control-allow-origin" not in {k.lower() for k in r_get.headers}
        assert "access-control-allow-credentials" not in {k.lower() for k in r_get.headers}
        assert r_get.headers.get("vary") == "Origin"

        r_opt = client.options("/api/vm/exec", headers={"Origin": bad_origin})
        assert r_opt.status_code == 403, f"OPTIONS allowed bad origin {bad_origin}"
        assert "access-control-allow-origin" not in {k.lower() for k in r_opt.headers}

        r_post = client.post("/api/mode", json={"mode": "regular"}, headers={"Origin": bad_origin})
        assert r_post.status_code == 403


def test_studio_loopback_origin_allowed_without_credentials(client):
    studio_origin = "http://127.0.0.1:3000"
    r = client.get("/health", headers={"Origin": studio_origin})
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == studio_origin
    assert "access-control-allow-credentials" not in {k.lower() for k in r.headers}
    assert r.headers.get("vary") == "Origin"

    r_opt = client.options("/api/chat", headers={"Origin": studio_origin})
    assert r_opt.status_code == 204
    assert r_opt.headers.get("access-control-allow-origin") == studio_origin
    assert "access-control-allow-credentials" not in {k.lower() for k in r_opt.headers}


# =====================================================================
# 2. Token Gating on Privileged REST & WebSocket Routes
# =====================================================================

def test_unauthenticated_privileged_routes_rejected(client):
    protected = [
        ("POST", "/api/vm/exec", {"command": "echo hi"}),
        ("POST", "/api/vm/install", {"package": "curl"}),
        ("GET", "/api/vm/status", None),
        ("POST", "/api/python/run", {"code": "print(1)"}),
        ("POST", "/api/ducky/run", {"script": "LOG test", "target": "browser"}),
        ("POST", "/api/config/save", {"updates": {"MODEL": "qwen2.5-coder:1.5b"}}),
        ("GET", "/api/workspace/file?path=test.txt", None),
        ("POST", "/api/workspace/file", {"path": "test.txt", "content": "hi"}),
        ("POST", "/api/workspace/file/delete", {"path": "test.txt"}),
        ("POST", "/api/browser/input", {"type": "key", "key": "Enter"}),
        ("POST", "/api/engine/set", {"engine": "ollama"}),
        ("POST", "/api/mode", {"mode": "regular"}),
    ]
    for method, path, body in protected:
        if method == "GET":
            r = client.get(path)
        else:
            r = client.post(path, json=body)
        assert r.status_code in (401, 403), f"{method} {path} unexpectedly returned {r.status_code}"


def test_authenticated_privileged_routes_succeed(client):
    hdrs = {"X-Azoth-Token": TEST_TOKEN}
    r_py = client.post("/api/python/run", json={"code": "print(6 * 7)"}, headers=hdrs)
    assert r_py.status_code == 200
    assert r_py.json().get("ok") is True
    assert "42" in r_py.json().get("output", "")

    r_mode = client.post("/api/mode", json={"mode": "regular"}, headers={"Authorization": f"Bearer {TEST_TOKEN}"})
    assert r_mode.status_code == 200
    assert r_mode.json().get("ok") is True


def test_websocket_terminal_rejects_unauthenticated_and_bad_origin(client):
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/terminal"):
            pass

    with pytest.raises(Exception):
        with client.websocket_connect(
            f"/ws/terminal?token={TEST_TOKEN}",
            headers={"Origin": "https://example.invalid"},
        ):
            pass


# =====================================================================
# 3. Body Limit (413), Security Headers, HEAD, SEO & Data Redaction
# =====================================================================

def test_body_limit_413(client):
    oversized = "A" * (1_048_576 + 1024)
    r = client.post(
        "/api/chat",
        content=json.dumps({"message": oversized}),
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 413
    assert r.json()["ok"] is False


def test_security_headers_head_and_seo_routes(client):
    r_h = client.get("/health")
    assert r_h.status_code == 200
    assert r_h.json()["version"] == "3.1.0"
    assert r_h.headers.get("x-frame-options") == "SAMEORIGIN"
    assert r_h.headers.get("x-content-type-options") == "nosniff"
    assert r_h.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "frame-ancestors" in (r_h.headers.get("content-security-policy") or "")

    r_head_root = client.head("/")
    assert r_head_root.status_code == 200
    assert len(r_head_root.content) == 0

    r_head_health = client.head("/health")
    assert r_head_health.status_code == 200
    assert len(r_head_health.content) == 0

    r_robots = client.get("/robots.txt")
    assert r_robots.status_code == 200
    assert "text/plain" in r_robots.headers.get("content-type", "")
    assert "User-agent:" in r_robots.text

    r_sm = client.get("/sitemap.xml")
    assert r_sm.status_code == 200
    assert "xml" in r_sm.headers.get("content-type", "")

    r_og = client.get("/og-banner.jpg")
    assert r_og.status_code == 200
    assert "image/jpeg" in r_og.headers.get("content-type", "")
    assert r_og.content[:3] == b"\xff\xd8\xff"


def test_api_engines_strips_api_key_and_presets_strip_host_paths(client):
    r_eng = client.get("/api/engines")
    assert r_eng.status_code == 200
    data = r_eng.json()
    assert "api_key" not in data["active"]

    r_pre = client.get("/api/ducky/presets")
    assert r_pre.status_code == 200
    for p in r_pre.json()["presets"]:
        if "path" in p:
            assert not p["path"].startswith("/")

    r_ws = client.get("/api/workspace")
    assert r_ws.status_code == 200
    assert not str(r_ws.json().get("path", "")).startswith("/")


# =====================================================================
# 4. Path Containment, Command Injection, Config Allowlist & SSRF
# =====================================================================

def test_workspace_sibling_prefix_traversal_returns_403(client):
    hdrs = {"X-Azoth-Token": TEST_TOKEN}
    r = client.get("/api/workspace/file?path=../workspace_sibling_probe/test.txt", headers=hdrs)
    assert r.status_code == 403
    assert r.json()["ok"] is False

    r_abs = client.get("/api/workspace/file?path=/etc/hostname", headers=hdrs)
    assert r_abs.status_code == 403


def test_browser_and_ducky_path_containment():
    from tools.browser import SandboxBrowser
    from tools.duckyscript import DuckyScriptEngine

    b = SandboxBrowser()
    res_exp = b.export_session(filepath="/tmp/azoth_outside_session.json")
    assert res_exp["ok"] is False
    assert res_exp.get("denied") is True

    res_imp = b.import_session(filepath="/etc/passwd")
    assert res_imp["ok"] is False
    assert res_imp.get("denied") is True

    eng = DuckyScriptEngine()
    with pytest.raises(PermissionError):
        eng.resolve_macro_content("/etc/hostname")

    res_ss = eng.execute("SCREENSHOT /tmp/azoth_escape_shot.png", target="browser")
    assert res_ss["ok"] is False
    assert "outside the sandbox workspace" in res_ss.get("error", "")


def test_vm_package_injection_and_host_fallback_blocked(monkeypatch):
    from tools.vm_manager import GuestOSManager

    monkeypatch.delenv("AZOTH_ALLOW_HOST_FALLBACK", raising=False)
    mgr = GuestOSManager()
    res_bad = mgr.install_package("curl; id")
    assert res_bad["exit_code"] != 0
    assert "Invalid package name" in res_bad.get("stderr", "")

    res_bad2 = mgr.install_package("curl && whoami")
    assert res_bad2["exit_code"] != 0

    if mgr.backend == "local_sandbox":
        res_cmd = mgr.run_command("echo should_be_blocked")
        assert res_cmd["exit_code"] == 126
        assert "Host shell fallback disabled" in res_cmd.get("stderr", "")


def test_config_save_rejects_disallowed_key_and_newlines(client):
    hdrs = {"X-Azoth-Token": TEST_TOKEN}
    r1 = client.post("/api/config/save", json={"updates": {"LD_PRELOAD": "/tmp/evil.so"}}, headers=hdrs)
    assert r1.status_code == 400
    assert r1.json()["ok"] is False

    r2 = client.post("/api/config/save", json={"updates": {"MODEL": "qwen\nEVIL=1"}}, headers=hdrs)
    assert r2.status_code == 400
    assert r2.json()["ok"] is False


def test_ssrf_blocks_file_and_imds_and_loopback():
    from tools.search import fetch_page
    from tools.browser import SandboxBrowser

    for bad_url in [
        "file:///etc/passwd",
        "http://169.254.169.254/latest/meta-data/",
        "http://127.0.0.1:8136/health",
        "http://10.0.0.1/admin",
        "http://100.64.0.1/status",
    ]:
        r_fetch = fetch_page(bad_url)
        assert r_fetch["ok"] is False, f"fetch_page allowed SSRF URL: {bad_url}"

    b = SandboxBrowser()
    for bad_url in ["file:///etc/passwd", "http://169.254.169.254/latest/meta-data/", "http://127.0.0.1:8136/"]:
        r_nav = b.navigate(bad_url)
        assert r_nav["ok"] is False, f"browser.navigate allowed SSRF URL: {bad_url}"


# =====================================================================
# 5. Offline Archon Chat Fallback & MCP Non-Dict Resilience
# =====================================================================

def test_offline_chat_fallback_returns_non_empty_reply(client, monkeypatch):
    monkeypatch.setenv("OPENAI_BASE_URL", "http://127.0.0.1:1/v1")
    with patch("web_ui.agent_step", side_effect=RuntimeError("Connection refused")):
        r = client.post("/api/chat", json={"message": "Verify local tools", "engine": "ollama", "mode": "regular"})
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data.get("fallback_used") is True
    assert isinstance(data.get("reply"), str) and len(data["reply"].strip()) > 10


def test_mcp_non_dict_json_does_not_crash():
    proc = subprocess.run(
        [sys.executable, str(ROOT / "mcp_server.py")],
        input="[]\nnull\n{\"jsonrpc\":\"2.0\",\"id\":9,\"method\":\"tools/call\",\"params\":\"bad\"}\n{\"jsonrpc\":\"2.0\",\"id\":10,\"method\":\"ping\"}\n",
        capture_output=True,
        text=True,
        timeout=10,
    )
    assert proc.returncode == 0, f"mcp_server crashed: {proc.stderr}"
    lines = [json.loads(ln) for ln in proc.stdout.strip().splitlines() if ln.strip()]
    assert len(lines) == 4
    assert lines[0]["error"]["code"] == -32600
    assert lines[1]["error"]["code"] == -32600
    assert lines[2]["error"]["code"] == -32602
    assert lines[3]["id"] == 10 and "result" in lines[3]
