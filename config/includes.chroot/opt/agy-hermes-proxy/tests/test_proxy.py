"""Comprehensive offline pytest suite for agy-hermes-proxy v2.0.0 (zero real LLM quota spent)."""

from __future__ import annotations

import asyncio
import json
import os
import signal
import socket
import stat
import subprocess
import sys
import textwrap
import threading
import time
from pathlib import Path
from typing import Any, Dict, Tuple

import httpx
import pytest
import uvicorn

from agy_hermes_proxy import __version__
from agy_hermes_proxy.app import (
    FALLBACK_MODELS,
    create_app,
    format_messages_to_prompt,
    is_allowed_host,
    is_allowed_loopback_origin,
    parse_agy_models_output,
)
from agy_hermes_proxy.cli import main as cli_main

BASE_URL = "http://127.0.0.1:18000"


MOCK_AGY_SCRIPT = textwrap.dedent(
    """\
    #!/usr/bin/env python3
    import json
    import os
    import signal
    import sys
    import time

    argv = sys.argv[1:]

    if argv == ["--version"]:
        print("1.5.18-mock")
        sys.exit(0)

    if argv == ["models"]:
        # Mimic spinner + 27 live models
        sys.stdout.write("\\r⠋ Fetching available models...\\r")
        models = [
            ("gemini-4-neon-high", "Gemini 4 Neon (High)"),
            ("gemini-4-neon-xhigh", "Gemini 4 Neon (XHigh)"),
            ("gemini-4-neon-medium", "Gemini 4 Neon (Medium)"),
            ("gemini-4-neon-low", "Gemini 4 Neon (Low)"),
            ("gemini-4-carbon-medium", "Gemini 4 Carbon (Medium)"),
            ("gemini-4-carbon-high", "Gemini 4 Carbon (High)"),
            ("gemini-4-carbon-low", "Gemini 4 Carbon (Low)"),
            ("gemini-4-argon-medium", "Gemini 4 Argon (Medium)"),
            ("gemini-4-argon-high", "Gemini 4 Argon (High)"),
            ("gemini-4-argon-low", "Gemini 4 Argon (Low)"),
            ("gemini-4-hydrogen-high", "Gemini 4 Hydrogen (High)"),
            ("gemini-4-hydrogen-xhigh", "Gemini 4 Hydrogen (XHigh)"),
            ("gemini-4-hydrogen-medium", "Gemini 4 Hydrogen (Medium)"),
            ("gemini-4-hydrogen-low", "Gemini 4 Hydrogen (Low)"),
            ("gemini-pro-orchestrator-neon", "Orchestrator (Neon)"),
            ("gemini-pro-orchestrator", "Orchestrator (Carbon)"),
            ("gemini-pro-orchestrator-argon", "Orchestrator (Argon)"),
            ("gemini-3.8-flash-high", "Gemini 3.8 Flash (High)"),
            ("gemini-3.8-flash-medium", "Gemini 3.8 Flash (Medium)"),
            ("gemini-3.8-flash-low", "Gemini 3.8 Flash (Low)"),
            ("claude-opus-5-5-low", "Claude Opus 5.5 (Low)"),
            ("claude-opus-5-5-medium", "Claude Opus 5.5 (Medium)"),
            ("claude-opus-5-5-high", "Claude Opus 5.5 (High)"),
            ("claude-sonnet-5-5-low", "Claude Sonnet 5.5 (Low)"),
            ("claude-sonnet-5-5-medium", "Claude Sonnet 5.5 (Medium)"),
            ("claude-sonnet-5-5-high", "Claude Sonnet 5.5 (High)"),
            ("gpt-oss-120b-medium", "GPT-OSS 120B (Medium)"),
        ]
        for mid, label in models:
            print(f"{mid:30s} {label}")
        sys.exit(0)

    mode = os.environ.get("MOCK_AGY_MODE", "echo")
    pid_file = os.environ.get("MOCK_AGY_PID_FILE", "")
    if pid_file:
        with open(pid_file, "a", encoding="utf-8") as fh:
            fh.write(f"{os.getpid()}\\n")
            fh.flush()

    raw_stdin = sys.stdin.read().strip()
    prompt_text = ""
    if raw_stdin:
        try:
            payload = json.loads(raw_stdin)
            prompt_text = payload["message"]["content"][0]["text"]
        except Exception:
            prompt_text = raw_stdin

    selected_model = ""
    if "--model" in argv:
        idx = argv.index("--model")
        if idx + 1 < len(argv):
            selected_model = argv[idx + 1]

    if mode == "fail":
        sys.stderr.write("fatal: auth token expired for /home/secretuser/creds\\n")
        sys.stderr.flush()
        sys.exit(1)

    if mode == "bigline":
        big = "A" * 82000
        print(json.dumps({"event": "step_update", "step_update": {"text_delta": big}}), flush=True)
        print(json.dumps({"event": "result", "result": {"response": big, "usage": {"prompt_tokens": 11, "completion_tokens": 20500, "total_tokens": 20511}}}), flush=True)
        sys.exit(0)

    if mode == "hang":
        print(json.dumps({"event": "step_update", "step_update": {"text_delta": "start..."}}), flush=True)
        time.sleep(10)
        print(json.dumps({"event": "result", "result": {"response": "done"}}), flush=True)
        sys.exit(0)

    if mode == "slow":
        delay = float(os.environ.get("MOCK_AGY_DELAY", "0.6"))
        time.sleep(delay)
        print(json.dumps({"event": "step_update", "step_update": {"text_delta": f"ok:{selected_model}"}}), flush=True)
        print(json.dumps({"event": "result", "result": {"response": f"ok:{selected_model}", "usage": {"prompt_tokens": 5, "completion_tokens": 3, "total_tokens": 8}}}), flush=True)
        sys.exit(0)

    # Default echo mode
    out = json.dumps({"model": selected_model, "prompt": prompt_text})
    print(json.dumps({"event": "step_update", "step_update": {"text_delta": out[:24]}}), flush=True)
    print(json.dumps({"event": "step_update", "step_update": {"text_delta": out[24:]}}), flush=True)
    print(json.dumps({"event": "result", "result": {"response": out, "usage": {"prompt_tokens": 42, "completion_tokens": 19, "total_tokens": 61}}}), flush=True)
    sys.exit(0)
    """
)


@pytest.fixture()
def mock_agy_bin(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    script = tmp_path / "mock_agy.py"
    script.write_text(MOCK_AGY_SCRIPT, encoding="utf-8")
    script.chmod(script.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    monkeypatch.setenv("AGY_BIN", str(script))
    monkeypatch.delenv("AGY_PROXY_TOKEN", raising=False)
    monkeypatch.setenv("AGY_PROXY_MAX_BODY_BYTES", str(1_048_576))
    monkeypatch.setenv("AGY_PROXY_MAX_CONCURRENCY", "4")
    monkeypatch.setenv("AGY_PROXY_ACQUIRE_TIMEOUT", "0.2")
    monkeypatch.setenv("AGY_PROXY_TIMEOUT_SECONDS", "15")
    monkeypatch.setenv("MOCK_AGY_MODE", "echo")
    monkeypatch.delenv("MOCK_AGY_PID_FILE", raising=False)
    return script


def _make_client(app) -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url=BASE_URL)


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _run_live_server(app, port: int) -> Tuple[uvicorn.Server, threading.Thread]:
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.monotonic() + 5.0
    while not server.started and time.monotonic() < deadline:
        time.sleep(0.02)
    assert server.started, "Failed to start test uvicorn server"
    return server, thread


# ---------------------------------------------------------------------------
# 1. Security: Loopback CORS, Host Allowlist & Optional Bearer Token
# ---------------------------------------------------------------------------

def test_origin_and_host_validators():
    assert is_allowed_host("127.0.0.1:18000")
    assert is_allowed_host("localhost:3000")
    assert is_allowed_host("[::1]:18000")
    assert is_allowed_host("localhost")
    assert not is_allowed_host("evil.example:18000")
    assert not is_allowed_host("127.0.0.1.evil.example:18000")
    assert not is_allowed_host("127.0.0.1:99999")
    assert not is_allowed_host("")

    assert is_allowed_loopback_origin("http://127.0.0.1:3000")
    assert is_allowed_loopback_origin("http://localhost:5173")
    assert is_allowed_loopback_origin("https://[::1]:8443")
    assert not is_allowed_loopback_origin("https://example.invalid")
    assert not is_allowed_loopback_origin("http://127.0.0.1:18000.example.invalid")
    assert not is_allowed_loopback_origin("http://user:pass@127.0.0.1:3000")
    assert not is_allowed_loopback_origin("http://127.0.0.1:3000/path")


def test_cors_blocks_evil_and_spoofed_origins_across_methods(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            bad_origins = [
                "https://example.invalid",
                "http://127.0.0.1:18000.example.invalid",
            ]
            for origin in bad_origins:
                for method, path, payload in [
                    ("OPTIONS", "/v1/chat/completions", None),
                    ("GET", "/health", None),
                    ("GET", "/v1/models", None),
                    ("POST", "/v1/chat/completions", {"model": "gemini-3.8-flash-high", "messages": [{"role": "user", "content": "hi"}]}),
                ]:
                    resp = await client.request(method, path, headers={"Origin": origin}, json=payload)
                    assert resp.status_code == 403, f"{method} {path} with {origin} returned {resp.status_code}"
                    assert "origin" in resp.headers.get("vary", "").lower()
                    assert "access-control-allow-origin" not in resp.headers
                    assert "access-control-allow-credentials" not in resp.headers
                    body = resp.json()
                    assert body["error"]["code"] == "origin_not_allowed"

            # Allowed loopback Origin
            opt = await client.options("/v1/chat/completions", headers={"Origin": "http://127.0.0.1:3000"})
            assert opt.status_code == 200
            assert opt.headers.get("access-control-allow-origin") == "http://127.0.0.1:3000"
            assert "origin" in opt.headers.get("vary", "").lower()
            assert "access-control-allow-credentials" not in opt.headers

            get_ok = await client.get("/health", headers={"Origin": "http://127.0.0.1:3000"})
            assert get_ok.status_code == 200
            assert get_ok.headers.get("access-control-allow-origin") == "http://127.0.0.1:3000"
            assert "origin" in get_ok.headers.get("vary", "").lower()
            assert "access-control-allow-credentials" not in get_ok.headers

    asyncio.run(run())


def test_dns_rebinding_host_allowlist_blocks_untrusted_host(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            for method, path in [("GET", "/health"), ("GET", "/v1/models"), ("POST", "/api/show")]:
                resp = await client.request(method, path, headers={"Host": "evil.example:18000"})
                assert resp.status_code == 403
                assert resp.json()["error"]["code"] == "invalid_host"

    asyncio.run(run())


def test_optional_bearer_token_enforcement(mock_agy_bin, monkeypatch):
    monkeypatch.setenv("AGY_PROXY_TOKEN", "s3cr3t-loopback-token")
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            # /health remains probeable for systemd/liveness
            assert (await client.get("/health")).status_code == 200
            # Missing or wrong token on API routes -> 401 OpenAI JSON
            r1 = await client.get("/v1/models")
            assert r1.status_code == 401
            assert r1.json()["error"]["code"] == "invalid_api_key"
            r2 = await client.get("/v1/models", headers={"Authorization": "Bearer wrong"})
            assert r2.status_code == 401
            # Valid token -> 200
            r3 = await client.get("/v1/models", headers={"Authorization": "Bearer s3cr3t-loopback-token"})
            assert r3.status_code == 200
            assert len(r3.json()["data"]) == 27

    asyncio.run(run())


# ---------------------------------------------------------------------------
# 2. Validation, OpenAI Error Envelopes & MAX_BODY_BYTES (413)
# ---------------------------------------------------------------------------

def test_malformed_and_invalid_payloads_never_500_plain_text(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            cases = [
                (b"{bad json", 400),
                (b"", 422),
                (b'["not","a","dict"]', 422),
                (b"null", 422),
                (b'{"messages":"not-a-list"}', 422),
                (b'{"messages":["not-a-dict"]}', 422),
                (b'{"messages":[{"role":123,"content":"hi"}]}', 422),
                (b'{"messages":[]}', 422),
            ]
            for raw, expected_code in cases:
                resp = await client.post(
                    "/v1/chat/completions",
                    content=raw,
                    headers={"Content-Type": "application/json"},
                )
                assert resp.status_code == expected_code, f"payload {raw!r} gave {resp.status_code}: {resp.text}"
                assert "application/json" in resp.headers.get("content-type", "")
                data = resp.json()
                assert "error" in data and {"message", "type", "param", "code"} <= set(data["error"].keys())

    asyncio.run(run())


def test_oversized_2mib_payload_rejected_413_before_parsing(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            big_body = b"x" * (2 * 1024 * 1024 + 1)
            resp = await client.post(
                "/v1/chat/completions",
                content=big_body,
                headers={"Content-Type": "application/json"},
            )
            assert resp.status_code == 413
            data = resp.json()
            assert data["error"]["code"] == "payload_too_large"

    asyncio.run(run())


# ---------------------------------------------------------------------------
# 3. Dynamic 27-Model Catalog, Strict Validation, Version & Health Hygiene
# ---------------------------------------------------------------------------

def test_health_head_version_metrics_and_dynamic_27_models(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            h = await client.get("/health")
            assert h.status_code == 200
            hj = h.json()
            assert hj["status"] == "ok"
            assert hj["version"] == __version__ == "2.0.0"
            assert hj["agy_available"] is True
            assert hj["agy_version"] == "1.5.18-mock"
            assert hj["models_count"] == 27
            assert "agy_bin" not in hj
            assert "/home/" not in h.text

            head = await client.head("/health")
            assert head.status_code == 200
            assert len(head.content) == 0

            v = await client.get("/version")
            assert v.status_code == 200
            assert v.json() == {"version": "2.0.0"}

            oas = await client.get("/openapi.json")
            assert oas.status_code == 200
            oas_json = oas.json()
            assert oas_json["info"]["version"] == "2.0.0"
            assert "ChatCompletionRequest" in oas_json["components"]["schemas"]

            met = await client.get("/metrics")
            assert met.status_code == 200
            mj = met.json()
            assert mj["cached_models_count"] == 27
            assert mj["max_concurrency"] == 4
            assert mj["total_requests"] >= 4

            m_list = await client.get("/v1/models")
            assert m_list.status_code == 200
            ids = [m["id"] for m in m_list.json()["data"]]
            assert len(ids) == 27
            assert "gemini-4-neon-high" in ids
            assert "claude-opus-5-5-high" in ids

            # Single model lookup
            one = await client.get("/v1/models/gemini-4-neon-high")
            assert one.status_code == 200
            assert one.json()["id"] == "gemini-4-neon-high"

            # Unknown model -> 404 on GET and POST (never silently drops --model!)
            miss_get = await client.get("/v1/models/nonexistent-model-xyz")
            assert miss_get.status_code == 404
            assert miss_get.json()["error"]["code"] == "model_not_found"

            miss_post = await client.post(
                "/v1/chat/completions",
                json={"model": "nonexistent-model-xyz", "messages": [{"role": "user", "content": "hi"}]},
            )
            assert miss_post.status_code == 404
            assert miss_post.json()["error"]["code"] == "model_not_found"

    asyncio.run(run())


# ---------------------------------------------------------------------------
# 4. Role Fidelity, Content Null, Collision-Free IDs & Streaming Schema
# ---------------------------------------------------------------------------

def test_roles_preserved_null_content_and_collision_free_ids(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            payload = {
                "model": "gemini-4-neon-high",
                "messages": [
                    {"role": "developer", "content": "Follow strict policy."},
                    {"role": "tool", "name": "lookup_db", "content": '{"rows": 3}'},
                    {"role": "function", "name": "calc", "content": "42"},
                    {"role": "user", "content": None},
                ],
            }
            r1 = await client.post("/v1/chat/completions", json=payload)
            r2 = await client.post("/v1/chat/completions", json=payload)
            assert r1.status_code == 200 and r2.status_code == 200
            j1, j2 = r1.json(), r2.json()
            assert j1["id"] != j2["id"]
            assert j1["id"].startswith("chatcmpl-agy-")
            assert j1["usage"] == {"prompt_tokens": 42, "completion_tokens": 19, "total_tokens": 61}

            echoed = json.loads(j1["choices"][0]["message"]["content"])
            assert echoed["model"] == "gemini-4-neon-high"
            prompt = echoed["prompt"]
            assert "[System Instructions]:\nFollow strict policy." in prompt
            assert "[Tool Result (lookup_db)]:\n{\"rows\": 3}" in prompt
            assert "[Tool Result (calc)]:\n42" in prompt
            assert "[User]:\n\n" not in prompt and "None" not in prompt

    asyncio.run(run())


def test_streaming_initial_role_chunk_usage_and_80kb_line(mock_agy_bin, monkeypatch):
    monkeypatch.setenv("MOCK_AGY_MODE", "bigline")
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            resp = await client.post(
                "/v1/chat/completions",
                json={
                    "model": "gemini-3.8-flash-high",
                    "messages": [{"role": "user", "content": "big"}],
                    "stream": True,
                    "stream_options": {"include_usage": True},
                },
            )
            assert resp.status_code == 200
            lines = [ln for ln in resp.text.splitlines() if ln.startswith("data: ")]
            assert lines[-1] == "data: [DONE]"
            events = [json.loads(ln[6:]) for ln in lines[:-1]]
            # Initial assistant role chunk
            assert events[0]["choices"][0]["delta"]["role"] == "assistant"
            # 82,000-char line received cleanly with zero LimitOverrunError
            content_total = "".join(
                ev["choices"][0]["delta"].get("content", "")
                for ev in events
                if ev.get("choices")
            )
            assert len(content_total) == 82000
            assert "LimitOverrunError" not in resp.text
            # Usage chunk present
            usage_events = [ev for ev in events if ev.get("usage")]
            assert len(usage_events) == 1
            assert usage_events[0]["usage"]["total_tokens"] == 20511

    asyncio.run(run())


# ---------------------------------------------------------------------------
# 5. Subprocess Error Handling, Timeout (504), Concurrency (429) & Orphan Kill
# ---------------------------------------------------------------------------

def test_nonzero_subprocess_exit_returns_502_and_sse_error(mock_agy_bin, monkeypatch):
    monkeypatch.setenv("MOCK_AGY_MODE", "fail")
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            r_non = await client.post(
                "/v1/chat/completions",
                json={"model": "gemini-3.8-flash-high", "messages": [{"role": "user", "content": "hi"}]},
            )
            assert r_non.status_code == 502
            err = r_non.json()["error"]
            assert err["code"] == "upstream_error"
            assert "auth token expired" in err["message"]

            r_stream = await client.post(
                "/v1/chat/completions",
                json={"model": "gemini-3.8-flash-high", "messages": [{"role": "user", "content": "hi"}], "stream": True},
            )
            assert r_stream.status_code == 200
            lines = [ln for ln in r_stream.text.splitlines() if ln.startswith("data: ")]
            assert lines[-1] == "data: [DONE]"
            events = [json.loads(ln[6:]) for ln in lines[:-1]]
            err_events = [ev for ev in events if "error" in ev]
            assert len(err_events) == 1
            assert err_events[0]["error"]["code"] == "upstream_error"
            assert err_events[0]["choices"][0]["finish_reason"] == "error"

    asyncio.run(run())


def test_execution_timeout_returns_504_and_kills_subprocess(mock_agy_bin, tmp_path, monkeypatch):
    pid_file = tmp_path / "timeout_pids.txt"
    monkeypatch.setenv("MOCK_AGY_MODE", "hang")
    monkeypatch.setenv("MOCK_AGY_PID_FILE", str(pid_file))
    monkeypatch.setenv("AGY_PROXY_TIMEOUT_SECONDS", "0.4")
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            r = await client.post(
                "/v1/chat/completions",
                json={"model": "gemini-3.8-flash-high", "messages": [{"role": "user", "content": "hang"}]},
            )
            assert r.status_code == 504
            assert r.json()["error"]["code"] == "gateway_timeout"

    asyncio.run(run())
    time.sleep(0.25)
    pids = [int(x) for x in pid_file.read_text().splitlines() if x.strip()]
    assert pids
    for pid in pids:
        with pytest.raises(ProcessLookupError):
            os.kill(pid, 0)


def test_semaphore_concurrency_cap_returns_429_when_saturated(mock_agy_bin, monkeypatch):
    monkeypatch.setenv("MOCK_AGY_MODE", "slow")
    monkeypatch.setenv("MOCK_AGY_DELAY", "0.6")
    monkeypatch.setenv("AGY_PROXY_ACQUIRE_TIMEOUT", "0.05")
    app = create_app(max_concurrency=1)

    async def run():
        async with _make_client(app) as client:
            req_body = {"model": "gemini-3.8-flash-high", "messages": [{"role": "user", "content": "slow"}]}
            t1 = asyncio.create_task(client.post("/v1/chat/completions", json=req_body))
            await asyncio.sleep(0.1)
            t2 = asyncio.create_task(client.post("/v1/chat/completions", json=req_body))
            r1, r2 = await asyncio.gather(t1, t2)
            statuses = sorted([r1.status_code, r2.status_code])
            assert statuses == [200, 429], f"Expected [200, 429], got {statuses}"
            limited = r2 if r2.status_code == 429 else r1
            assert limited.json()["error"]["code"] == "concurrency_limit_exceeded"

    asyncio.run(run())


def test_streaming_client_disconnect_kills_orphan_subprocess(mock_agy_bin, tmp_path, monkeypatch):
    pid_file = tmp_path / "disconnect_pids.txt"
    monkeypatch.setenv("MOCK_AGY_MODE", "hang")
    monkeypatch.setenv("MOCK_AGY_PID_FILE", str(pid_file))
    monkeypatch.setenv("AGY_PROXY_TIMEOUT_SECONDS", "15")

    port = _free_port()
    app = create_app(max_concurrency=2)
    server, thread = _run_live_server(app, port)
    try:
        # Open raw TCP connection, send streaming POST, read initial bytes, then close abruptly
        body = json.dumps(
            {
                "model": "gemini-3.8-flash-high",
                "messages": [{"role": "user", "content": "hang"}],
                "stream": True,
            }
        ).encode("utf-8")
        raw_req = (
            f"POST /v1/chat/completions HTTP/1.1\r\n"
            f"Host: 127.0.0.1:{port}\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            f"Connection: close\r\n\r\n"
        ).encode("ascii") + body

        sock = socket.create_connection(("127.0.0.1", port), timeout=5)
        sock.sendall(raw_req)
        chunk = sock.recv(4096)
        assert b"200 OK" in chunk
        # Wait until mock subprocess records its PID
        deadline = time.monotonic() + 3.0
        while (not pid_file.exists() or not pid_file.read_text().strip()) and time.monotonic() < deadline:
            time.sleep(0.05)
        sock.close()

        pids = [int(x) for x in pid_file.read_text().splitlines() if x.strip()]
        assert pids, "Expected mock subprocess PID to be recorded"

        # Wait up to 2.5s for disconnect detector + terminate() cleanup
        reaped = False
        end = time.monotonic() + 2.5
        while time.monotonic() < end:
            alive = []
            for pid in pids:
                try:
                    os.kill(pid, 0)
                    alive.append(pid)
                except ProcessLookupError:
                    pass
            if not alive:
                reaped = True
                break
            time.sleep(0.1)
        assert reaped, f"Orphan subprocess leaked after client disconnect: {pids}"
    finally:
        server.should_exit = True
        thread.join(timeout=5)


# ---------------------------------------------------------------------------
# 6. Zero-Egress Operator Cockpit (`GET /`), Offline `/docs`, and CLI
# ---------------------------------------------------------------------------

def test_zero_egress_cockpit_and_offline_docs(mock_agy_bin):
    app = create_app()

    async def run():
        async with _make_client(app) as client:
            r_html = await client.get("/", headers={"Accept": "text/html"})
            assert r_html.status_code == 200
            html_text = r_html.text
            assert "AGY-Hermes OpenAI Bridge" in html_text
            assert "cdn.jsdelivr.net" not in html_text
            assert "fonts.googleapis.com" not in html_text
            assert "fastapi.tiangolo.com" not in html_text
            assert "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X" in html_text
            assert "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK" in html_text
            assert "Engineered by Neal Frazier Tech (@1nc0gn30)" in html_text

            r_json = await client.get("/", headers={"Accept": "application/json"})
            assert r_json.status_code == 200
            assert r_json.json()["version"] == "2.0.0"

            r_docs = await client.get("/docs")
            assert r_docs.status_code == 200
            assert "Offline OpenAPI Explorer" in r_docs.text
            assert "cdn.jsdelivr.net" not in r_docs.text
            assert "fonts.googleapis.com" not in r_docs.text

    asyncio.run(run())


def test_cli_subcommands_version_status_models_doctor(mock_agy_bin, capsys):
    # --version
    with pytest.raises(SystemExit) as exc:
        cli_main(["--version"])
    assert exc.value.code == 0
    assert "agy-hermes-proxy 2.0.0" in capsys.readouterr().out

    port = _free_port()
    app = create_app()
    server, thread = _run_live_server(app, port)
    try:
        assert cli_main(["status", "--port", str(port), "--json"]) == 0
        st = json.loads(capsys.readouterr().out)
        assert st["version"] == "2.0.0"
        assert st["models_count"] == 27

        assert cli_main(["models", "--port", str(port), "--json"]) == 0
        ml = json.loads(capsys.readouterr().out)
        assert len(ml["data"]) == 27

        assert cli_main(["doctor", "--port", str(port), "--json"]) == 0
        doc = json.loads(capsys.readouterr().out)
        assert doc["ok"] is True
        assert doc["proxy_online"] is True
        assert doc["proxy_version"] == "2.0.0"
    finally:
        server.should_exit = True
        thread.join(timeout=5)
