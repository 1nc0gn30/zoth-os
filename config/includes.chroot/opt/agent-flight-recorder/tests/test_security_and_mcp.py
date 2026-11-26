"""
test_security_and_mcp.py - Comprehensive Security, Hash Chain, Export & Stdio MCP Tests (v2.6.0).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import http.client
import io
import json
import os
import sqlite3
import tempfile
import time

import pytest

from agent_flight_recorder.storage import FlightStorage
from agent_flight_recorder.server import FlightDeckServer, MAX_BODY_BYTES
from agent_flight_recorder.mcp_server import FlightRecorderMCPServer


def _http_req(port: int, method: str, path: str, body: bytes = b"", headers=None):
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    hdrs = dict(headers or {})
    if body and "Content-Length" not in hdrs:
        hdrs["Content-Length"] = str(len(body))
    conn.request(method, path, body=body, headers=hdrs)
    resp = conn.getresponse()
    raw = resp.read()
    resp_headers = {k.lower(): v for k, v in resp.getheaders()}
    conn.close()
    return resp.status, resp_headers, raw


class TestSecurityHashChainAndExports:
    @classmethod
    def setup_class(cls):
        cls.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        cls.storage = FlightStorage(db_path=cls.temp_db)
        cls.server = FlightDeckServer(host="127.0.0.1", port=0, storage=cls.storage)
        cls.server.start()
        cls.port = cls.server.port
        time.sleep(0.2)

    @classmethod
    def teardown_class(cls):
        cls.server.stop()
        for ext in ("", "-wal", "-shm"):
            p = cls.temp_db + ext
            if os.path.exists(p):
                os.remove(p)

    def test_origin_port_suffix_bypass_blocked(self):
        spoof_origin = f"http://127.0.0.1:{self.port}.example.invalid"
        st_opt, hdr_opt, _ = _http_req(self.port, "OPTIONS", "/api/ingest", headers={"Origin": spoof_origin})
        assert st_opt == 403
        assert "access-control-allow-origin" not in hdr_opt

        st_get, hdr_get, _ = _http_req(self.port, "GET", "/api/stats", headers={"Origin": spoof_origin})
        assert st_get == 403
        assert "access-control-allow-origin" not in hdr_get

        payload = json.dumps({"event_type": "marker", "payload": {"x": 1}}).encode()
        st_post, hdr_post, _ = _http_req(
            self.port, "POST", "/api/ingest", body=payload, headers={"Origin": spoof_origin, "Content-Type": "application/json"}
        )
        assert st_post == 403
        assert "access-control-allow-origin" not in hdr_post

    def test_allowed_origin_cors_and_vary_and_root_no_acao(self):
        st_opt, hdr_opt, _ = _http_req(
            self.port, "OPTIONS", "/api/ingest", headers={"Origin": "http://127.0.0.1:3000"}
        )
        assert st_opt == 204
        assert hdr_opt.get("access-control-allow-origin") == "http://127.0.0.1:3000"
        assert hdr_opt.get("vary") == "Origin"

        st_root, hdr_root, _ = _http_req(
            self.port, "GET", "/", headers={"Origin": "http://127.0.0.1:3000"}
        )
        assert st_root == 200
        assert "access-control-allow-origin" not in hdr_root

    def test_foreign_host_header_blocked(self):
        st_get, _, _ = _http_req(self.port, "GET", "/api/stats", headers={"Host": f"evil.example:{self.port}"})
        assert st_get == 403
        st_post, _, _ = _http_req(
            self.port,
            "POST",
            "/api/ingest",
            body=b'{"event_type":"marker","payload":{}}',
            headers={"Host": f"evil.example:{self.port}", "Content-Type": "application/json"},
        )
        assert st_post == 403

    def test_path_traversal_and_unknown_api_routes(self):
        for bad_path in ("/../server.py", "/%2e%2e/server.py", "/..%2fpyproject.toml"):
            st, _, _ = _http_req(self.port, "GET", bad_path)
            assert st in (403, 404), f"Expected 403/404 for {bad_path}, got {st}"

        st_unk, hdr_unk, raw_unk = _http_req(self.port, "GET", "/api/does-not-exist")
        assert st_unk == 404
        assert "application/json" in hdr_unk.get("content-type", "")
        assert "error" in json.loads(raw_unk.decode())

    def test_validation_bad_json_non_dict_offset_and_oversized(self):
        st1, _, _ = _http_req(self.port, "POST", "/api/ingest", body=b"{not-json")
        assert st1 == 400

        st2, _, _ = _http_req(self.port, "POST", "/api/ingest", body=b'["array","not","dict"]')
        assert st2 == 400

        st3, _, _ = _http_req(
            self.port,
            "POST",
            "/api/ingest",
            body=b"x",
            headers={"Content-Length": str(MAX_BODY_BYTES + 10)},
        )
        assert st3 == 413

        st4, _, _ = _http_req(self.port, "GET", "/api/scrub/any-session?offset_ms=abc")
        assert st4 == 400

        st5, _, _ = _http_req(self.port, "GET", "/api/sessions?limit=abc")
        assert st5 == 400

    def test_capsule_jail_auto_session_hash_chain_tamper_and_exports(self):
        # Cross-daemon ingestion with explicit session_id + XSS + CSV formula payloads
        ev1 = {
            "session_id": "capsule-jail-audit",
            "event_type": "capsule_execution",
            "severity": "INFO",
            "offset_ms": 120.0,
            "payload": {
                "capsule_id": "cap-001",
                "command": "=cmd|'/C calc'!A0",
                "output": "override</script><script>window.__xss=1</script>",
                "exit_code": 0,
            },
        }
        st, _, raw = _http_req(
            self.port,
            "POST",
            "/api/ingest",
            body=json.dumps(ev1).encode(),
            headers={"Content-Type": "application/json"},
        )
        assert st == 200
        res = json.loads(raw.decode())
        assert res["session_id"] == "capsule-jail-audit"
        assert res["chain_valid"] is True
        assert len(res["head_hash"]) == 64

        # Session must exist in /api/sessions and /api/session/capsule-jail-audit
        st_s, _, raw_s = _http_req(self.port, "GET", "/api/session/capsule-jail-audit")
        assert st_s == 200
        assert json.loads(raw_s.decode())["event_count"] >= 1

        # Verify chain valid
        st_v, _, raw_v = _http_req(self.port, "GET", "/api/verify/capsule-jail-audit")
        assert st_v == 200
        vdata = json.loads(raw_v.decode())
        assert vdata["valid"] is True
        assert vdata["broken_at_event_id"] is None

        # GET & POST /api/export/bundle -> 200 and XSS escaped
        st_b1, _, raw_b1 = _http_req(self.port, "GET", "/api/export/bundle?session_id=capsule-jail-audit")
        assert st_b1 == 200
        html_text = raw_b1.decode("utf-8")
        assert "</script><script>window.__xss=1</script>" not in html_text
        assert "\\u003c/script\\u003e\\u003cscript\\u003ewindow.__xss=1\\u003c/script\\u003e" in html_text

        st_b2, _, _ = _http_req(
            self.port,
            "POST",
            "/api/export/bundle",
            body=json.dumps({"session_id": "capsule-jail-audit"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        assert st_b2 == 200

        # Missing session export -> clean 404 JSON
        st_miss, hdr_miss, _ = _http_req(self.port, "GET", "/api/export/bundle?session_id=nonexistent-999")
        assert st_miss == 404
        assert "application/json" in hdr_miss.get("content-type", "")

        # JSON, CSV (formula neutralized), Markdown exports
        st_j, _, raw_j = _http_req(self.port, "GET", "/api/export/json?session_id=capsule-jail-audit")
        assert st_j == 200
        assert json.loads(raw_j.decode())["hash_chain"]["valid"] is True

        st_c, _, raw_c = _http_req(self.port, "GET", "/api/export/csv?session_id=capsule-jail-audit")
        assert st_c == 200
        csv_text = raw_c.decode("utf-8")
        assert "session_id,event_id,seq" in csv_text

        # Test direct formula neutralization on a cell starting with '='
        ev_formula = {
            "session_id": "capsule-jail-audit",
            "event_type": "=HYPERLINK(\"http://evil\")",
            "payload": {"note": "formula test"},
            "offset_ms": 200.0,
        }
        _http_req(self.port, "POST", "/api/ingest", body=json.dumps(ev_formula).encode())
        st_c2, _, raw_c2 = _http_req(self.port, "GET", "/api/export/csv?session_id=capsule-jail-audit")
        assert st_c2 == 200
        assert "'=HYPERLINK" in raw_c2.decode("utf-8")

        st_m, _, raw_m = _http_req(self.port, "GET", "/api/export/markdown?session_id=capsule-jail-audit")
        assert st_m == 200
        assert "# Agent Flight Recorder Incident Report" in raw_m.decode("utf-8")

        # GET /api/events filter
        st_ev, _, raw_ev = _http_req(self.port, "GET", "/api/events?session_id=capsule-jail-audit&event_type=capsule_execution")
        assert st_ev == 200
        assert json.loads(raw_ev.decode())["count"] == 1

        # Tamper detection: mutate SQLite row directly and verify /api/verify returns valid: False
        conn = sqlite3.connect(self.temp_db)
        conn.execute(
            "UPDATE timeline_events SET payload_json = ? WHERE session_id = ? AND seq = 1",
            (json.dumps({"tampered": True}), "capsule-jail-audit"),
        )
        conn.commit()
        conn.close()

        st_vt, _, raw_vt = _http_req(self.port, "GET", "/api/verify/capsule-jail-audit")
        assert st_vt == 200
        vt = json.loads(raw_vt.decode())
        assert vt["valid"] is False
        assert vt["broken_at_event_id"] is not None


class TestStdioMCPServer:
    def test_mcp_initialize_list_and_four_tools(self):
        tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        try:
            storage = FlightStorage(db_path=tmp_db)
            mcp = FlightRecorderMCPServer(storage=storage)

            reqs = [
                {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}},
                {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
                {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {
                        "name": "flight_recorder_ingest",
                        "arguments": {
                            "session_id": "mcp-test-session",
                            "event_type": "terminal_stdout",
                            "payload": {"text": "MCP hello world"},
                            "offset_ms": 50,
                        },
                    },
                },
                {
                    "jsonrpc": "2.0",
                    "id": 4,
                    "method": "tools/call",
                    "params": {"name": "flight_recorder_sessions", "arguments": {"limit": 10}},
                },
                {
                    "jsonrpc": "2.0",
                    "id": 5,
                    "method": "tools/call",
                    "params": {
                        "name": "flight_recorder_scrub",
                        "arguments": {"session_id": "mcp-test-session", "offset_ms": 100},
                    },
                },
                {
                    "jsonrpc": "2.0",
                    "id": 6,
                    "method": "tools/call",
                    "params": {"name": "flight_recorder_verify", "arguments": {"session_id": "mcp-test-session"}},
                },
            ]
            stdin_buf = io.StringIO("\n".join(json.dumps(r) for r in reqs) + "\n")
            stdout_buf = io.StringIO()
            mcp.serve_stdio(stdin=stdin_buf, stdout=stdout_buf)

            responses = [json.loads(line) for line in stdout_buf.getvalue().strip().splitlines()]
            assert len(responses) == 6
            assert responses[0]["result"]["serverInfo"]["version"] == "2.6.0"

            tool_names = {t["name"] for t in responses[1]["result"]["tools"]}
            assert tool_names == {
                "flight_recorder_scrub",
                "flight_recorder_sessions",
                "flight_recorder_ingest",
                "flight_recorder_verify",
            }
            assert responses[2]["result"]["structuredContent"]["chain_valid"] is True
            assert len(responses[3]["result"]["structuredContent"]["sessions"]) == 1
            assert "MCP hello world" in responses[4]["result"]["structuredContent"]["terminal_text"]
            assert responses[5]["result"]["structuredContent"]["valid"] is True
        finally:
            for ext in ("", "-wal", "-shm"):
                p = tmp_db + ext
                if os.path.exists(p):
                    os.remove(p)
