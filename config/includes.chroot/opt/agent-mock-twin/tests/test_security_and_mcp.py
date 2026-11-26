"""
test_security_and_mcp.py: Comprehensive v2.6.0 security, CRLF, SIGTERM, template-matching,
SQLite WAL, TUI, CLI, and 4-tool stdio MCP tests for agent-mock-twin.
"""

from __future__ import annotations

import http.client
import io
import json
import os
import signal
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_DIR = os.path.join(REPO_ROOT, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from agent_mock_twin.matcher import RequestMatcher, _match_path_template
from agent_mock_twin.mcp_server import MCPServer
from agent_mock_twin.mock_server import MAX_BODY_BYTES, VERSION, MockServer
from agent_mock_twin.parser import OpenAPIParser, RecordedRoute


class TestSecurityAndApiHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls.tmp.name, "sec_test.db")
        cls.server = MockServer(
            host="127.0.0.1",
            port=0,
            db_path=cls.db_path,
            base_latency_ms=0,
            jitter_ms=0,
        )
        cls.port = cls.server.port
        cls.server.run_in_thread()
        time.sleep(0.15)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown_cleanly()
        cls.tmp.cleanup()

    def _raw_http(self, raw_request: bytes) -> bytes:
        with socket.create_connection(("127.0.0.1", self.port), timeout=3) as s:
            s.sendall(raw_request)
            chunks = []
            while True:
                data = s.recv(4096)
                if not data:
                    break
                chunks.append(data)
            return b"".join(chunks)

    def _req(self, method: str, path: str, body: bytes = b"", headers: dict | None = None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=3)
        hdrs = dict(headers or {})
        if body and "Content-Type" not in hdrs:
            hdrs["Content-Type"] = "application/json"
        conn.request(method, path, body=body if body else None, headers=hdrs)
        resp = conn.getresponse()
        raw = resp.read()
        out_headers = {k.lower(): v for k, v in resp.getheaders()}
        conn.close()
        return resp.status, out_headers, raw

    def test_origin_port_suffix_blocked_403_no_acao(self):
        bad_origin = f"http://127.0.0.1:{self.port}.example.invalid"
        for method, path, body in (
            ("OPTIONS", "/api/config", b""),
            ("GET", "/api/stats", b""),
            ("POST", "/api/config", b'{"base_latency_ms": 10}'),
        ):
            status, hdrs, _ = self._req(method, path, body=body, headers={"Origin": bad_origin})
            self.assertEqual(status, 403, f"{method} {path} should reject spoofed origin")
            self.assertNotIn("access-control-allow-origin", hdrs)
            self.assertEqual(hdrs.get("vary"), "Origin")

    def test_allowed_origin_options_204_and_vary(self):
        status, hdrs, _ = self._req("OPTIONS", "/api/stats", headers={"Origin": "http://127.0.0.1:3000"})
        self.assertEqual(status, 204)
        self.assertEqual(hdrs.get("access-control-allow-origin"), "http://127.0.0.1:3000")
        self.assertEqual(hdrs.get("vary"), "Origin")

    def test_foreign_host_header_blocked_403(self):
        raw = (
            f"GET /api/stats HTTP/1.1\r\n"
            f"Host: evil.example:{self.port}\r\n"
            f"Connection: close\r\n\r\n"
        ).encode("ascii")
        resp = self._raw_http(raw)
        self.assertTrue(resp.startswith(b"HTTP/1.0 403") or resp.startswith(b"HTTP/1.1 403"), resp[:80])
        self.assertNotIn(b"Access-Control-Allow-Origin", resp)

    def test_get_root_has_no_acao(self):
        status, hdrs, body = self._req("GET", "/")
        self.assertEqual(status, 200)
        self.assertNotIn("access-control-allow-origin", hdrs)
        self.assertIn(b"Agent Mock Twin", body)

    def test_crlf_header_injection_blocked_on_upload_and_emission(self):
        malicious_upload = json.dumps([
            {
                "method": "GET",
                "path": "/v1/crlf-check",
                "response_status": 200,
                "response_headers": {"x-custom": "ok\r\nX-Injected-Header: crlf-proven"},
                "response_body": '{"ok":true}',
            }
        ]).encode("utf-8")
        status, _, body = self._req("POST", "/api/upload", body=malicious_upload)
        self.assertEqual(status, 400, body.decode("utf-8", errors="replace"))

        # Defense-in-depth: even if a bad header were manually forced into memory/route object, emission skips it
        bad_route = RecordedRoute(
            id="forced_crlf",
            method="GET",
            path="/v1/crlf-direct",
            query_params={},
            headers={},
            body_hash="empty",
            body_keys=[],
            raw_body="",
            response_status=200,
            response_headers={"x-custom": "ok\r\nX-Injected-Header: crlf-direct"},
            response_body='{"safe":true}',
        )
        self.server.storage._routes_cache.append(bad_route)
        raw = (
            f"GET /v1/crlf-direct HTTP/1.1\r\n"
            f"Host: 127.0.0.1:{self.port}\r\n"
            f"Connection: close\r\n\r\n"
        ).encode("ascii")
        resp = self._raw_http(raw)
        self.assertNotIn(b"X-Injected-Header", resp)
        self.server.storage._routes_cache = [r for r in self.server.storage._routes_cache if r.id != "forced_crlf"]

    def test_input_validation_and_body_cap(self):
        # Invalid limit
        status, _, _ = self._req("GET", "/api/hits?limit=abc")
        self.assertEqual(status, 400)

        # Clamped limit
        status, _, body = self._req("GET", "/api/hits?limit=-5")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["limit"], 1)

        # Invalid Content-Length
        raw_bad_cl = (
            f"POST /api/config HTTP/1.1\r\n"
            f"Host: 127.0.0.1:{self.port}\r\n"
            f"Content-Length: abc\r\n"
            f"Connection: close\r\n\r\n"
        ).encode("ascii")
        resp_bad_cl = self._raw_http(raw_bad_cl)
        self.assertIn(b" 400 ", resp_bad_cl.split(b"\r\n", 1)[0])

        # Oversized Content-Length -> 413
        raw_big_cl = (
            f"POST /api/upload HTTP/1.1\r\n"
            f"Host: 127.0.0.1:{self.port}\r\n"
            f"Content-Length: {MAX_BODY_BYTES + 1024}\r\n"
            f"Connection: close\r\n\r\n"
        ).encode("ascii")
        resp_big_cl = self._raw_http(raw_big_cl)
        self.assertIn(b" 413 ", resp_big_cl.split(b"\r\n", 1)[0])

        # /api/config rejects array and invalid chaos_type, clamps valid numeric bounds
        status, _, _ = self._req("POST", "/api/config", body=b'["arr"]')
        self.assertEqual(status, 400)
        status, _, _ = self._req("POST", "/api/config", body=b'{"chaos_type":"bogus"}')
        self.assertEqual(status, 400)
        status, _, body = self._req(
            "POST",
            "/api/config",
            body=b'{"base_latency_ms":-50,"jitter_ms":99999,"chaos_rate":99.0,"chaos_type":"503_service_unavailable"}',
        )
        self.assertEqual(status, 200)
        cfg = json.loads(body)["config"]
        self.assertEqual(cfg["base_latency_ms"], 0)
        self.assertEqual(cfg["jitter_ms"], 5000)
        self.assertEqual(cfg["chaos_rate"], 1.0)
        # Reset chaos_rate back to 0
        self._req("POST", "/api/config", body=b'{"chaos_rate":0.0,"chaos_type":"429_rate_limit"}')

    def test_unknown_api_404_without_hit_pollution(self):
        before_hits = self.server.storage.get_stats()["total_hits"]
        for p in ("/api/requests", "/api/unknown-xyz"):
            status, _, body = self._req("GET", p)
            self.assertEqual(status, 404)
            self.assertFalse(json.loads(body)["success"])
        after_hits = self.server.storage.get_stats()["total_hits"]
        self.assertEqual(before_hits, after_hits)

    def test_static_traversal_returns_403(self):
        for path in ("/../server.py", "/%2e%2e/server.py", "/..%2fpyproject.toml"):
            raw = (
                f"GET {path} HTTP/1.1\r\n"
                f"Host: 127.0.0.1:{self.port}\r\n"
                f"Connection: close\r\n\r\n"
            ).encode("ascii")
            resp = self._raw_http(raw)
            self.assertIn(b" 403 ", resp.split(b"\r\n", 1)[0], f"Expected 403 for {path}")

    def test_health_key_mapping_and_openapi_template_matching(self):
        self._req("POST", "/api/clear")
        spec = {
            "openapi": "3.0.0",
            "paths": {
                "/v1/users/{id}": {
                    "get": {
                        "summary": "Fetch user by ID",
                        "responses": {
                            "200": {
                                "content": {
                                    "application/json": {
                                        "example": {"id": "42", "role": "agent", "matched_template": True}
                                    }
                                }
                            }
                        },
                    }
                }
            },
        }
        status, _, _ = self._req("POST", "/api/upload", body=json.dumps(spec).encode("utf-8"))
        self.assertEqual(status, 200)

        # Match /v1/users/42 against /v1/users/{id}
        status, hdrs, body = self._req("GET", "/v1/users/42")
        self.assertEqual(status, 200)
        self.assertEqual(hdrs.get("x-mock-type"), "template")
        self.assertTrue(json.loads(body)["matched_template"])

        # /health must accurately reflect routes_count, total_hits, saved_dollars, and version 2.6.0
        status, _, hbody = self._req("GET", "/health")
        self.assertEqual(status, 200)
        health = json.loads(hbody)
        self.assertEqual(health["version"], VERSION)
        self.assertEqual(health["routes_count"], 1)
        self.assertEqual(health["total_hits"], 1)
        self.assertGreater(health["saved_dollars"], 0.0)
        self.assertEqual(health["saved_dollars"], health["total_usd_saved"])


class TestDeterministicMatcherAndTemplate(unittest.TestCase):
    def test_template_matcher_redos_safe(self):
        self.assertEqual(_match_path_template("/v1/users/{id}", "/v1/users/42"), (2, {"id": "42"}))
        self.assertEqual(_match_path_template("/v1/orgs/{org}/agents/{id}", "/v1/orgs/zoth/agents/99"), (3, {"org": "zoth", "id": "99"}))
        self.assertIsNone(_match_path_template("/v1/users/{id}", "/v1/users/42/extra"))
        self.assertIsNone(_match_path_template("/v1/users", "/v1/users"))

    def test_fallback_ids_are_deterministic(self):
        m = RequestMatcher(base_latency_ms=0, jitter_ms=0)
        r1 = m.match("POST", "/v1/chat/completions", {}, {}, '{"model":"gpt-4o"}', [])
        r2 = m.match("POST", "/v1/chat/completions", {}, {}, '{"model":"gpt-4o"}', [])
        self.assertEqual(r1.route.id, r2.route.id)
        self.assertEqual(r1.route.response_body, r2.route.response_body)


class TestSigtermAndMcpAndTui(unittest.TestCase):
    def test_server_sigterm_exits_cleanly_under_2s(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "sigterm.db")
            proc = subprocess.Popen(
                [sys.executable, os.path.join(REPO_ROOT, "server.py"), "--host", "127.0.0.1", "--port", "0", "--db", db_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                # Wait briefly for server startup line
                time.sleep(0.4)
                t0 = time.monotonic()
                proc.send_signal(signal.SIGTERM)
                rc = proc.wait(timeout=2.0)
                elapsed = time.monotonic() - t0
                self.assertEqual(rc, 0)
                self.assertLess(elapsed, 2.0)
            finally:
                if proc.poll() is None:
                    proc.kill()

    def test_mcp_4_tools_stdio(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "mcp.db")
            mcp = MCPServer(db_path=db_path, port=1)  # force local-sqlite path

            # 1. initialize
            r_init = mcp.handle_request({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
            self.assertEqual(r_init["result"]["serverInfo"]["version"], VERSION)

            # 2. tools/list
            r_list = mcp.handle_request({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
            names = {t["name"] for t in r_list["result"]["tools"]}
            self.assertEqual(names, {"mock_replay_query", "mock_list_routes", "mock_import_spec", "mock_get_stats"})

            # 3. mock_import_spec
            r_imp = mcp.handle_request({
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {
                    "name": "mock_import_spec",
                    "arguments": {
                        "spec": {
                            "openapi": "3.0.0",
                            "paths": {
                                "/v1/items/{id}": {
                                    "get": {
                                        "responses": {"200": {"content": {"application/json": {"example": {"item": "ok"}}}}}
                                    }
                                }
                            },
                        }
                    },
                },
            })
            self.assertFalse(r_imp["result"]["isError"])
            self.assertEqual(r_imp["result"]["structuredContent"]["imported_count"], 1)

            # 4. mock_list_routes
            r_routes = mcp.handle_request({
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {"name": "mock_list_routes", "arguments": {}},
            })
            self.assertEqual(r_routes["result"]["structuredContent"]["count"], 1)

            # 5. mock_replay_query against template route
            r_play = mcp.handle_request({
                "jsonrpc": "2.0",
                "id": 5,
                "method": "tools/call",
                "params": {"name": "mock_replay_query", "arguments": {"method": "GET", "path": "/v1/items/77"}},
            })
            sc = r_play["result"]["structuredContent"]
            self.assertEqual(sc["matchedTier"], "template")
            self.assertEqual(sc["response"]["item"], "ok")

            # 6. mock_get_stats
            r_stats = mcp.handle_request({
                "jsonrpc": "2.0",
                "id": 6,
                "method": "tools/call",
                "params": {"name": "mock_get_stats", "arguments": {}},
            })
            self.assertEqual(r_stats["result"]["structuredContent"]["stats"]["total_hits"], 1)

    def test_tui_once_and_json_no_boilerplate(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "tui.db")
            res = subprocess.run(
                [sys.executable, os.path.join(REPO_ROOT, "bin", "agent-mock-twin-tui"), "--port", "1", "--db", db_path, "--json"],
                capture_output=True,
                text=True,
                check=True,
            )
            data = json.loads(res.stdout)
            self.assertEqual(data["service"], "agent-mock-twin")
            self.assertEqual(data["version"], VERSION)
            self.assertNotIn("audio_lufs", res.stdout)
            self.assertNotIn("canvasui-html-effects", res.stdout)


if __name__ == "__main__":
    unittest.main()
