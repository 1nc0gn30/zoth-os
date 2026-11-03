"""
Automated Test Suite for WebMCP Protocol Suite (`webmcp-protocol-inspector`).
Verifies schema safety scoring, token estimation, preset catalog, and live JSON-RPC 2.0 HTTP endpoints.
"""

from __future__ import annotations

import json
import threading
import urllib.request
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from server import SAMPLE_PRESETS, audit_schema, run_server


def test_sample_presets_all_score_a_plus():
    assert len(SAMPLE_PRESETS) == 3
    for preset in SAMPLE_PRESETS:
        result = audit_schema(preset)
        assert result["score"] == 100
        assert result["grade"] == "A+"
        assert result["is_safe"] is True
        assert result["warnings"] == []
        assert result["tokenEstimate"] > 10


def test_audit_schema_detects_missing_fields_and_warnings():
    empty_audit = audit_schema({})
    assert empty_audit["score"] < 50
    assert empty_audit["grade"] == "F"
    assert empty_audit["is_safe"] is False
    assert len(empty_audit["warnings"]) >= 3


def test_audit_schema_flags_undocumented_properties():
    partial = {
        "name": "custom_tool",
        "description": "Executes a custom sovereign tool transformation in memory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target": {"type": "string"},
                "documented": {"type": "number", "description": "Valid numeric threshold"}
            }
        }
    }
    res = audit_schema(partial)
    assert res["score"] == 95
    assert res["grade"] == "A+"
    assert any("target" in w for w in res["warnings"])


def test_http_endpoints_health_presets_inspect_and_simulate():
    httpd = run_server(host="127.0.0.1", port=0)
    port = httpd.server_port
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        # 1. GET /health
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=3) as resp:
            assert resp.status == 200
            health = json.loads(resp.read().decode("utf-8"))
            assert health["status"] == "ok"
            assert health["service"] == "webmcp-protocol-inspector"

        # 2. GET /api/presets
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/presets", timeout=3) as resp:
            assert resp.status == 200
            presets_data = json.loads(resp.read().decode("utf-8"))
            assert presets_data["status"] == "ok"
            assert len(presets_data["presets"]) == 3

        # 3. POST /api/inspect
        req_inspect = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/inspect",
            data=json.dumps({"schema": SAMPLE_PRESETS[0]}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_inspect, timeout=3) as resp:
            assert resp.status == 200
            inspected = json.loads(resp.read().decode("utf-8"))
            assert inspected["status"] == "ok"
            assert inspected["audit"]["grade"] == "A+"

        # 4. POST /api/rpc/simulate
        req_sim = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/rpc/simulate",
            data=json.dumps({
                "jsonrpc": "2.0",
                "id": 42,
                "method": "tools/call/solana_tip_transfer",
                "params": {"recipient": "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK", "amountSol": 0.05}
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_sim, timeout=3) as resp:
            assert resp.status == 200
            sim = json.loads(resp.read().decode("utf-8"))
            assert sim["jsonrpc"] == "2.0"
            assert sim["id"] == 42
            assert sim["result"]["isError"] is False
            assert sim["result"]["simulated"] is True
    finally:
        httpd.shutdown()
        httpd.server_close()
