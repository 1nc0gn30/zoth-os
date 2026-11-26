"""Isolated Unit & Regression Tests for agent-voice-call v2.6.0.

Zero external network calls, zero live cloud TTS, isolated tmp_path persistence.
"""

from __future__ import annotations

import http.client
import io
import json
import os
import stat
import threading
import time
from pathlib import Path
from unittest.mock import patch

import pytest

from agent_voice_call import __version__
from agent_voice_call.call_engine import CallManager, CallTurn, SessionLimitError
from agent_voice_call.cli import main as cli_main
from agent_voice_call.mcp_server import TOOLS, handle_jsonrpc_message, run_stdio
from agent_voice_call.server import MAX_BODY_BYTES, PUBLIC_DIR, VoiceCallServer
from agent_voice_call.tts_bridge import (
    VOICES,
    _synthesize_espeak,
    _synthesize_pcm_fallback,
    convert_wav_to_opus_ogg,
    generate_voice_file,
    is_cloud_tts_allowed,
    is_kokoro_online,
    synthesize_speech_wav_with_engine,
)


@pytest.fixture()
def isolated_server(tmp_path, monkeypatch):
    monkeypatch.setenv("VOICE_CALL_DATA_DIR", str(tmp_path / "voice_calls"))
    monkeypatch.setenv("VOICE_CALL_DISABLE_EXTERNAL_HOOKS", "1")
    monkeypatch.setenv("VOICE_CALL_DISABLE_OLLAMA", "1")
    monkeypatch.delenv("ZOTH_ALLOW_CLOUD_TTS", raising=False)

    manager = CallManager(data_dir=tmp_path / "voice_calls")
    server = VoiceCallServer("127.0.0.1", 0, manager)
    port = server.server_port
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield server, port, manager, tmp_path
    server.shutdown()
    server.server_close()


def _http_req(port: int, method: str, path: str, body: bytes = b"", headers: dict | None = None):
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5.0)
    hdrs = dict(headers or {})
    if body and "Content-Length" not in hdrs:
        hdrs["Content-Length"] = str(len(body))
    conn.request(method, path, body=body if body else None, headers=hdrs)
    resp = conn.getresponse()
    raw = resp.read()
    resp_headers = {k.lower(): v for k, v in resp.getheaders()}
    conn.close()
    return resp.status, resp_headers, raw


# ---------------------------------------------------------------------------
# 1. Version & Local-First Zero-Egress TTS Bridge
# ---------------------------------------------------------------------------
def test_version_is_2_6_0():
    assert __version__ == "2.6.0"


def test_voices_registry():
    for v in ("azoth", "ghostbyte", "athena", "mercury", "kitsune", "chronos"):
        assert v in VOICES
    assert VOICES["azoth"]["id"] == "am_michael"


def test_local_first_tts_never_calls_cloud_by_default(monkeypatch):
    monkeypatch.delenv("ZOTH_ALLOW_CLOUD_TTS", raising=False)
    assert is_cloud_tts_allowed() is False

    with patch("agent_voice_call.tts_bridge._synthesize_kokoro", return_value=None), \
         patch("agent_voice_call.tts_bridge._synthesize_piper", return_value=None), \
         patch("agent_voice_call.tts_bridge._synthesize_edge_tts", side_effect=AssertionError("Cloud TTS must NOT be called by default")):
        wav, engine = synthesize_speech_wav_with_engine("Local zero egress test.", voice_name="azoth")
        assert wav is not None and wav.startswith(b"RIFF")
        assert engine in ("espeak-ng", "pcm-synth")


def test_cloud_tts_only_when_opted_in(monkeypatch):
    monkeypatch.setenv("ZOTH_ALLOW_CLOUD_TTS", "1")
    assert is_cloud_tts_allowed() is True
    fake_wav = _synthesize_pcm_fallback("cloud opt in test", "azoth")
    with patch("agent_voice_call.tts_bridge._synthesize_kokoro", return_value=None), \
         patch("agent_voice_call.tts_bridge._synthesize_piper", return_value=None), \
         patch("agent_voice_call.tts_bridge._synthesize_edge_tts", return_value=fake_wav) as m_edge:
        wav, engine = synthesize_speech_wav_with_engine("Opt-in cloud check", voice_name="azoth")
        assert m_edge.called
        assert wav == fake_wav
        assert engine == "edge-tts"


def test_espeak_leading_dash_flag_safety():
    wav = _synthesize_espeak("--version", voice_name="azoth")
    if wav is not None:
        assert wav.startswith(b"RIFF")
        assert len(wav) > 44


def test_pcm_fallback_produces_valid_wav():
    wav = _synthesize_pcm_fallback("Deterministic pure python audio", voice_name="athena")
    assert wav.startswith(b"RIFF")
    assert b"WAVE" in wav[:16]
    assert len(wav) > 1000


def test_generate_voice_file_isolated_tmp_path(tmp_path, monkeypatch):
    monkeypatch.delenv("ZOTH_ALLOW_CLOUD_TTS", raising=False)
    out = generate_voice_file("Isolated voice note.", voice_name="azoth", out_format="wav", out_dir=tmp_path)
    assert out is not None
    p = Path(out)
    assert p.exists()
    assert p.parent == tmp_path
    assert p.stat().st_size > 100
    assert stat.S_IMODE(p.stat().st_mode) == 0o600


def test_convert_wav_to_opus_without_crash():
    wav = _synthesize_pcm_fallback("opus test", "azoth")
    res = convert_wav_to_opus_ogg(wav)
    assert res is not None and len(res) > 44


# ---------------------------------------------------------------------------
# 2. CallEngine Persistence, Session Bounds & TTL
# ---------------------------------------------------------------------------
def test_call_engine_debrief_persistence_0600(tmp_path, monkeypatch):
    monkeypatch.setenv("VOICE_CALL_DISABLE_EXTERNAL_HOOKS", "1")
    monkeypatch.setenv("VOICE_CALL_DISABLE_OLLAMA", "1")
    mgr = CallManager(data_dir=tmp_path / "calls")

    sid, tok = mgr.create_call_token(channel="web", voice="athena")
    sess = mgr.validate_token(tok)
    assert sess is not None

    with patch("agent_voice_call.call_engine.synthesize_speech_wav_with_engine", return_value=(b"RIFFfake", "pcm-synth")):
        reply, audio, latency = mgr.process_utterance(sess, "Hello Athena")
    assert "Athena" in reply
    assert audio == b"RIFFfake"
    assert latency >= 0.0

    summary = mgr.end_call_session(sess)
    assert summary["session_id"] == sid
    assert summary["persisted_local"] is True
    assert summary["simplex_dispatched"] is False
    assert mgr.debriefs_path.exists()
    assert stat.S_IMODE(mgr.debriefs_path.stat().st_mode) == 0o600

    history = mgr.list_debriefs(limit=5)
    assert len(history) == 1
    assert history[0]["session_id"] == sid


def test_session_cap_enforced(tmp_path):
    mgr = CallManager(data_dir=tmp_path / "cap", max_sessions=3)
    for _ in range(3):
        mgr.create_call_token(channel="web", voice="azoth")
    with pytest.raises(SessionLimitError):
        mgr.create_call_token(channel="web", voice="azoth")


# ---------------------------------------------------------------------------
# 3. HTTP Security, Origin/Host Guards, Crash Paths, HEAD, Session Hygiene
# ---------------------------------------------------------------------------
def test_health_reports_v260_and_local_first(isolated_server):
    _, port, _, _ = isolated_server
    status, headers, raw = _http_req(port, "GET", "/health")
    assert status == 200
    assert headers.get("vary") == "Origin"
    data = json.loads(raw)
    assert data["version"] == "2.6.0"
    assert data["local_first_tts"] is True
    assert data["cloud_tts_opt_in"] is False


def test_origin_port_suffix_bypass_rejected_everywhere(isolated_server):
    _, port, _, _ = isolated_server
    evil = f"http://127.0.0.1:{port}.example.invalid"

    for method, path, body in (
        ("OPTIONS", "/api/call/create", b""),
        ("GET", "/api/voices", b""),
        ("POST", "/api/call/create", b'{"voice":"azoth"}'),
    ):
        status, headers, _ = _http_req(port, method, path, body=body, headers={"Origin": evil, "Content-Type": "application/json"})
        assert status == 403, f"{method} {path} should return 403 for {evil}, got {status}"
        assert headers.get("vary") == "Origin"
        assert "access-control-allow-origin" not in headers


def test_host_header_dns_rebinding_blocked(isolated_server):
    _, port, _, _ = isolated_server
    for method, path, body in (
        ("GET", "/health", b""),
        ("POST", "/api/call/create", b'{"voice":"azoth"}'),
    ):
        status, _, raw = _http_req(port, method, path, body=body, headers={"Host": f"evil.example:{port}"})
        assert status == 403
        assert json.loads(raw)["error"] == "invalid_host_header"


def test_head_returns_zero_body_bytes(isolated_server):
    _, port, _, _ = isolated_server
    for path in ("/", "/health"):
        status, headers, raw = _http_req(port, "HEAD", path)
        assert status == 200
        assert raw == b""
        assert int(headers.get("content-length", "0")) > 0


def test_unsupported_method_returns_405_json(isolated_server):
    _, port, _, _ = isolated_server
    status, headers, raw = _http_req(port, "PUT", "/health")
    assert status == 405
    assert "GET" in headers.get("allow", "")
    assert json.loads(raw)["error"] == "method_not_allowed"


def test_input_validation_and_body_cap(isolated_server):
    _, port, _, _ = isolated_server

    # Non-numeric Content-Length
    status, _, raw = _http_req(port, "POST", "/api/call/create", headers={"Content-Length": "abc"})
    assert status == 400 and json.loads(raw)["error"] == "invalid_content_length"

    # Negative Content-Length
    status, _, raw = _http_req(port, "POST", "/api/call/create", headers={"Content-Length": "-5"})
    assert status == 400 and json.loads(raw)["error"] == "invalid_content_length"

    # Oversized > 1 MiB body -> 413
    status, _, raw = _http_req(
        port, "POST", "/api/call/create",
        headers={"Content-Length": str(MAX_BODY_BYTES + 100), "Content-Type": "application/json"},
    )
    assert status == 413 and json.loads(raw)["error"] == "payload_too_large"

    # Malformed JSON -> 400 (must NOT create session)
    status, _, raw = _http_req(port, "POST", "/api/call/create", body=b"{bad json", headers={"Content-Type": "application/json"})
    assert status == 400 and json.loads(raw)["error"] == "invalid_json"

    # Non-dict JSON array -> 400
    status, _, raw = _http_req(port, "POST", "/api/call/create", body=b'["not","a","dict"]', headers={"Content-Type": "application/json"})
    assert status == 400 and json.loads(raw)["error"] == "json_object_required"

    # Non-string voice -> 400
    status, _, raw = _http_req(port, "POST", "/api/call/create", body=b'{"voice": 12345}', headers={"Content-Type": "application/json"})
    assert status == 400 and json.loads(raw)["error"] == "invalid_field_type"


def test_get_session_does_not_mutate_and_ended_token_rejected_on_speak(isolated_server):
    _, port, manager, _ = isolated_server
    assert manager.active_session_count() == 0

    # Missing token -> 401, zero sessions created
    status, _, _ = _http_req(port, "GET", "/api/call/session")
    assert status == 401
    assert manager.active_session_count() == 0

    # Invalid token -> 404, zero sessions created
    status, _, _ = _http_req(port, "GET", "/api/call/session?token=bogus-invalid")
    assert status == 404
    assert manager.active_session_count() == 0

    # Create -> Speak -> End -> Replay Speak on ended token MUST return 401
    status, _, raw = _http_req(port, "POST", "/api/call/create", body=b'{"channel":"web","voice":"mercury"}', headers={"Content-Type": "application/json"})
    assert status == 200
    tok = json.loads(raw)["token"]
    assert manager.active_session_count() == 1

    # Non-string text -> 400
    status, _, _ = _http_req(port, "POST", "/api/call/speak", body=json.dumps({"token": tok, "text": 12345}).encode(), headers={"Content-Type": "application/json"})
    assert status == 400

    # Valid speak -> 200
    status, _, raw = _http_req(port, "POST", "/api/call/speak", body=json.dumps({"token": tok, "text": "Hello Mercury", "voice": "mercury"}).encode(), headers={"Content-Type": "application/json"})
    assert status == 200
    speak_data = json.loads(raw)
    assert "Mercury" in speak_data["reply_text"]
    assert speak_data["audio_base64"]
    assert speak_data["tts_engine"] in ("kokoro", "piper", "espeak-ng", "pcm-synth")

    # End call -> 200 & persisted to /api/call/history
    status, _, raw = _http_req(port, "POST", "/api/call/end", body=json.dumps({"token": tok}).encode(), headers={"Content-Type": "application/json"})
    assert status == 200
    assert json.loads(raw)["summary"]["persisted_local"] is True

    status, _, raw = _http_req(port, "GET", "/api/call/history?limit=5")
    assert status == 200
    assert json.loads(raw)["count"] == 1

    # Speak with ended token -> 401 (never mints replacement session!)
    status, _, raw = _http_req(port, "POST", "/api/call/speak", body=json.dumps({"token": tok, "text": "After hangup"}).encode(), headers={"Content-Type": "application/json"})
    assert status == 401
    assert json.loads(raw)["error"] == "invalid_or_expired_token"
    assert manager.active_session_count() == 0


def test_static_traversal_and_symlink_containment(isolated_server):
    _, port, _, tmp_path = isolated_server
    for bad in ("/../pyproject.toml", "/%2e%2e/pyproject.toml", "/..%2fpyproject.toml"):
        status, _, _ = _http_req(port, "GET", bad)
        assert status in (403, 404)

    # Create temporary symlink inside public/ pointing outside to verify is_relative_to() blocks it
    secret_file = tmp_path / "outside_secret.txt"
    secret_file.write_text("TOP_SECRET", encoding="utf-8")
    link_path = PUBLIC_DIR / "_test_escape_symlink.txt"
    try:
        link_path.symlink_to(secret_file)
        status, _, raw = _http_req(port, "GET", "/_test_escape_symlink.txt")
        assert status == 403
        assert b"TOP_SECRET" not in raw
    finally:
        if link_path.is_symlink() or link_path.exists():
            link_path.unlink()


# ---------------------------------------------------------------------------
# 4. Stdio MCP Server (4 Real Tools) & CLI Subcommands
# ---------------------------------------------------------------------------
def test_mcp_stdio_all_four_tools(tmp_path, monkeypatch):
    monkeypatch.setenv("VOICE_CALL_DATA_DIR", str(tmp_path / "mcp_calls"))
    monkeypatch.setenv("VOICE_CALL_DISABLE_EXTERNAL_HOOKS", "1")
    monkeypatch.setenv("VOICE_CALL_DISABLE_OLLAMA", "1")
    monkeypatch.delenv("ZOTH_ALLOW_CLOUD_TTS", raising=False)

    requests = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "agent_voice_call_status", "arguments": {"port": 19999}}},
        {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "agent_voice_call_voices", "arguments": {}}},
        {"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "agent_voice_call_speak", "arguments": {"text": "Hello Kitsune", "voice": "kitsune", "persist": True}}},
        {"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {"name": "agent_voice_call_debriefs", "arguments": {"limit": 5}}},
    ]
    in_buf = io.StringIO("\n".join(json.dumps(r) for r in requests) + "\n")
    out_buf = io.StringIO()
    assert run_stdio(stdin=in_buf, stdout=out_buf) == 0

    responses = [json.loads(line) for line in out_buf.getvalue().splitlines() if line.strip()]
    assert len(responses) == 6
    assert responses[0]["result"]["serverInfo"]["version"] == "2.6.0"

    tool_names = [t["name"] for t in responses[1]["result"]["tools"]]
    assert tool_names == [
        "agent_voice_call_status",
        "agent_voice_call_voices",
        "agent_voice_call_speak",
        "agent_voice_call_debriefs",
    ]
    assert len(TOOLS) == 4

    speak_res = json.loads(responses[4]["result"]["content"][0]["text"])
    assert "Kitsune" in speak_res["reply_text"]
    assert speak_res["wav_bytes"] > 44
    assert speak_res["persisted"] is True

    debrief_res = json.loads(responses[5]["result"]["content"][0]["text"])
    assert debrief_res["count"] == 1


def test_cli_version_status_and_desktop_dry_run(capsys, tmp_path, monkeypatch):
    monkeypatch.setenv("VOICE_CALL_DATA_DIR", str(tmp_path / "cli_calls"))
    with pytest.raises(SystemExit) as exc:
        cli_main(["--version"])
    assert exc.value.code == 0
    assert "2.6.0" in capsys.readouterr().out

    assert cli_main(["status", "--port", "19999", "--json"]) == 0
    status_out = json.loads(capsys.readouterr().out)
    assert status_out["version"] == "2.6.0"
    assert status_out["local_first_tts"] is True

    assert cli_main(["desktop", "--port", "19999", "--dry-run"]) == 0
    desk_out = json.loads(capsys.readouterr().out)
    assert desk_out["action"] == "desktop"
    assert desk_out["version"] == "2.6.0"
