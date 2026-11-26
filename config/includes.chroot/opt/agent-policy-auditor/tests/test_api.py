"""Isolated integration tests for CockpitHandler HTTP REST API & security guards."""

from __future__ import annotations

import http.client
import json
import os
import sqlite3
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request

from agent_policy_auditor.broker import PolicyBroker
from agent_policy_auditor.web_cockpit import MAX_BODY_BYTES, create_server


class TestCockpitAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls.temp_dir.name, "isolated_api_test.db")
        cls.secret = "isolated-test-hmac-secret-0123456789abcdef"
        cls.broker = PolicyBroker(db_path=cls.db_path, secret_key=cls.secret)
        cls.server = create_server(port=0, host="127.0.0.1", broker=cls.broker)
        cls.port = cls.server.server_port
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.05)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.temp_dir.cleanup()

    def _raw_request(self, method: str, path: str, body: bytes = b"", headers: dict | None = None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=3)
        hdrs = dict(headers or {})
        if body and "Content-Length" not in hdrs:
            hdrs["Content-Length"] = str(len(body))
        conn.request(method, path, body=body, headers=hdrs)
        resp = conn.getresponse()
        data = resp.read()
        resp_headers = dict(resp.getheaders())
        conn.close()
        return resp.status, resp_headers, data

    def test_health_status_stats_and_events(self) -> None:
        st, hdrs, data = self._raw_request("GET", "/health")
        self.assertEqual(st, 200)
        self.assertEqual(json.loads(data)["version"], "2.6.0")
        self.assertEqual(hdrs.get("Vary"), "Origin")

        st, hdrs, data = self._raw_request("GET", "/api/status")
        self.assertEqual(st, 200)
        self.assertIn("application/json", hdrs.get("Content-Type", ""))
        body = json.loads(data)
        self.assertEqual(body["status"], "ok")
        self.assertIn("stats", body)
        self.assertIn("key_fingerprint", body)

        st, _, data = self._raw_request("GET", "/api/stats")
        self.assertEqual(st, 200)
        stats = json.loads(data)
        self.assertIn("total_leases_granted", stats)
        self.assertIn("uptime_seconds", stats)

    def test_api_grant_verify_revoke_and_killswitch(self) -> None:
        # Grant Lease
        grant_body = json.dumps({
            "agent_id": "api_test_agent",
            "capability": "FS_READ",
            "target": "/tmp/work/*",
            "duration_sec": 60,
            "budget_usd": 1.0,
        }).encode()
        st, _, data = self._raw_request("POST", "/api/leases/grant", grant_body, {"Content-Type": "application/json"})
        self.assertEqual(st, 200)
        granted = json.loads(data)
        self.assertEqual(granted["status"], "granted")
        lease_id = granted["lease"]["lease_id"]

        # Verify Allowed Action
        verify_ok = json.dumps({
            "lease_id": lease_id,
            "capability": "FS_READ",
            "target": "/tmp/work/test.txt",
            "cost_usd": 0.25,
        }).encode()
        st, _, data = self._raw_request("POST", "/api/leases/verify", verify_ok, {"Content-Type": "application/json"})
        self.assertEqual(st, 200)
        res_v = json.loads(data)
        self.assertTrue(res_v["allowed"])
        self.assertAlmostEqual(res_v["used_budget_usd"], 0.25, places=4)

        # Path traversal attempt MUST be denied
        verify_trav = json.dumps({
            "lease_id": lease_id,
            "capability": "FS_READ",
            "target": "/tmp/work/../../etc/passwd",
            "cost_usd": 0.0,
        }).encode()
        st, _, data = self._raw_request("POST", "/api/leases/verify", verify_trav, {"Content-Type": "application/json"})
        self.assertEqual(st, 200)
        self.assertFalse(json.loads(data)["allowed"])

        # Negative cost MUST return 400
        verify_neg = json.dumps({
            "lease_id": lease_id,
            "capability": "FS_READ",
            "target": "/tmp/work/test.txt",
            "cost_usd": -100.0,
        }).encode()
        st, _, _ = self._raw_request("POST", "/api/leases/verify", verify_neg, {"Content-Type": "application/json"})
        self.assertEqual(st, 400)

        # Grant second lease for another agent and verify global kill-switch revokes ALL
        grant2 = json.dumps({
            "agent_id": "other_agent_99",
            "capability": "NET_EGRESS",
            "target": "api.nullai.tech",
            "duration_sec": 60,
        }).encode()
        st, _, _ = self._raw_request("POST", "/api/leases/grant", grant2, {"Content-Type": "application/json"})
        self.assertEqual(st, 200)

        st, _, data = self._raw_request(
            "POST",
            "/api/leases/revoke_all",
            json.dumps({"all_agents": True}).encode(),
            {"Content-Type": "application/json"},
        )
        self.assertEqual(st, 200)
        self.assertGreaterEqual(json.loads(data)["revoked_count"], 2)

        st, _, data = self._raw_request("GET", "/api/leases")
        self.assertEqual(json.loads(data)["count"], 0)

        st, _, data = self._raw_request("GET", "/api/audit/events?limit=20")
        self.assertEqual(st, 200)
        self.assertGreater(json.loads(data)["count"], 0)

    def test_origin_cors_and_host_dns_rebinding_guards(self) -> None:
        # Port-suffix CSRF bypass MUST be blocked on OPTIONS, GET, POST
        bad_origin = "http://127.0.0.1:8106.example.invalid"
        for method, path in [("OPTIONS", "/api/stats"), ("GET", "/api/stats"), ("POST", "/api/audit")]:
            st, hdrs, _ = self._raw_request(method, path, b"{}", {"Origin": bad_origin, "Content-Type": "application/json"})
            self.assertEqual(st, 403, f"Expected 403 for {method} {path} with {bad_origin}")
            self.assertNotIn("Access-Control-Allow-Origin", hdrs)
            self.assertEqual(hdrs.get("Vary"), "Origin")

        # Untrusted https origin blocked on OPTIONS too
        st, hdrs, _ = self._raw_request("OPTIONS", "/api/stats", headers={"Origin": "https://example.invalid"})
        self.assertEqual(st, 403)
        self.assertNotIn("Access-Control-Allow-Origin", hdrs)

        # Trusted local origin allowed and echoed with Vary: Origin
        st, hdrs, _ = self._raw_request("OPTIONS", "/api/stats", headers={"Origin": "http://127.0.0.1:3000"})
        self.assertEqual(st, 204)
        self.assertEqual(hdrs.get("Access-Control-Allow-Origin"), "http://127.0.0.1:3000")
        self.assertEqual(hdrs.get("Vary"), "Origin")

        # DNS rebinding Host header rejected on GET and POST
        st, _, _ = self._raw_request("GET", "/api/stats", headers={"Host": "evil.example:8106"})
        self.assertEqual(st, 403)
        st, _, _ = self._raw_request("POST", "/api/audit", b'{"manifest":{}}', {"Host": "evil.example:8106", "Content-Type": "application/json"})
        self.assertEqual(st, 403)

    def test_malformed_json_crashes_and_body_cap(self) -> None:
        before_count = self.broker.get_stats()["total_leases_granted"]

        # Malformed JSON must return 400 and NEVER silently grant a lease
        st, _, _ = self._raw_request("POST", "/api/leases/grant", b"{bad json", {"Content-Type": "application/json"})
        self.assertEqual(st, 400)
        self.assertEqual(self.broker.get_stats()["total_leases_granted"], before_count)

        # Non-dict JSON array -> 400
        st, _, _ = self._raw_request("POST", "/api/leases/grant", b'["not","a","dict"]', {"Content-Type": "application/json"})
        self.assertEqual(st, 400)

        # Invalid numeric strings -> 400
        bad_dur = json.dumps({"agent_id": "a", "capability": "FS_READ", "target": "/tmp/*", "duration_sec": "abc"}).encode()
        st, _, _ = self._raw_request("POST", "/api/leases/grant", bad_dur, {"Content-Type": "application/json"})
        self.assertEqual(st, 400)

        # Bogus capability, negative TTL, excessive TTL, negative budget -> 400
        for payload in [
            {"agent_id": "a", "capability": "BOGUS_CAP", "target": "/tmp/*"},
            {"agent_id": "a", "capability": "FS_READ", "target": "/tmp/*", "duration_sec": -60},
            {"agent_id": "a", "capability": "SHELL_EXEC", "target": "*", "duration_sec": 999999999},
            {"agent_id": "a", "capability": "FS_READ", "target": "/tmp/*", "budget_usd": -5.0},
        ]:
            st, _, _ = self._raw_request("POST", "/api/leases/grant", json.dumps(payload).encode(), {"Content-Type": "application/json"})
            self.assertEqual(st, 400, f"Expected 400 for {payload}")

        # Non-dict tools[] entry on /api/audit -> safe 200 (zero crash)
        st, _, data = self._raw_request(
            "POST",
            "/api/audit",
            json.dumps({"manifest": {"tools": ["not_a_dict", 123]}}).encode(),
            {"Content-Type": "application/json"},
        )
        self.assertEqual(st, 200)
        self.assertIn("security_score", json.loads(data))

        # Invalid Content-Length -> 400
        st, _, _ = self._raw_request("POST", "/api/audit", b"", {"Content-Length": "abc"})
        self.assertEqual(st, 400)

        # Oversized body > 1 MiB -> 413 Payload Too Large
        st, _, _ = self._raw_request("POST", "/api/audit", b"", {"Content-Length": str(MAX_BODY_BYTES + 10)})
        self.assertEqual(st, 413)

    def test_unknown_api_404_traversal_403_and_xml_mime(self) -> None:
        st, hdrs, _ = self._raw_request("GET", "/api/unknown-xyz")
        self.assertEqual(st, 404)
        self.assertIn("application/json", hdrs.get("Content-Type", ""))

        for trav in ("/../pyproject.toml", "/%2e%2e/pyproject.toml", "/..%2fpyproject.toml", "/assets/../../pyproject.toml"):
            st, _, _ = self._raw_request("GET", trav)
            self.assertEqual(st, 403, f"Expected 403 for {trav}")

        st, hdrs, _ = self._raw_request("GET", "/sitemap.xml")
        self.assertEqual(st, 200)
        self.assertIn("application/xml", hdrs.get("Content-Type", ""))

    def test_sqlite_wal_and_permissions(self) -> None:
        conn = sqlite3.connect(self.db_path)
        mode = conn.execute("PRAGMA journal_mode").fetchone()[0]
        conn.close()
        self.assertEqual(mode.lower(), "wal")
        file_mode = os.stat(self.db_path).st_mode & 0o777
        self.assertEqual(file_mode, 0o600)


if __name__ == "__main__":
    unittest.main()
