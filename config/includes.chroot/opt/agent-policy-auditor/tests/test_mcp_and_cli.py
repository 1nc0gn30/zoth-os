"""Tests for stdio JSON-RPC 2.0 MCP server and CLI subcommands."""

from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from agent_policy_auditor.broker import PolicyBroker
from agent_policy_auditor.mcp_server import run_stdio_server

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestMCPAndCLI(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "mcp_cli_test.db")
        self.secret = "mcp-cli-test-secret-0123456789abcdef"

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_stdio_mcp_full_lifecycle(self) -> None:
        broker = PolicyBroker(db_path=self.db_path, secret_key=self.secret)
        requests = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
            {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {
                    "name": "policy_lease_grant",
                    "arguments": {
                        "agent_id": "mcp_agent",
                        "capability": "FS_WRITE",
                        "target": "/tmp/mcp/*",
                        "duration_sec": 120,
                        "budget_usd": 2.0,
                    },
                },
            },
            {
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {
                    "name": "policy_audit_manifest",
                    "arguments": {
                        "name": "mcp_probe",
                        "manifest": {"tools": [{"name": "bash_exec", "parameters": {}}]},
                    },
                },
            },
        ]

        stdin = io.StringIO("\n".join(json.dumps(r) for r in requests) + "\n")
        stdout = io.StringIO()
        rc = run_stdio_server(stdin=stdin, stdout=stdout, broker=broker)
        self.assertEqual(rc, 0)

        responses = [json.loads(line) for line in stdout.getvalue().strip().splitlines()]
        self.assertEqual(len(responses), 4)  # notification yields no response
        self.assertEqual(responses[0]["result"]["serverInfo"]["version"], "2.6.0")

        tool_names = [t["name"] for t in responses[1]["result"]["tools"]]
        self.assertEqual(
            tool_names,
            ["policy_lease_grant", "policy_lease_verify", "policy_lease_revoke", "policy_audit_manifest"],
        )

        grant_payload = responses[2]["result"]["structuredContent"]
        self.assertEqual(grant_payload["status"], "granted")
        lease_id = grant_payload["lease"]["lease_id"]

        audit_payload = responses[3]["result"]["structuredContent"]
        self.assertEqual(audit_payload["risk_level"], "HIGH")

        # Verify & revoke via second stdio call
        reqs2 = [
            {
                "jsonrpc": "2.0",
                "id": 5,
                "method": "tools/call",
                "params": {
                    "name": "policy_lease_verify",
                    "arguments": {
                        "lease_id": lease_id,
                        "capability": "FS_WRITE",
                        "target": "/tmp/mcp/out.txt",
                        "cost_usd": 0.5,
                    },
                },
            },
            {
                "jsonrpc": "2.0",
                "id": 6,
                "method": "tools/call",
                "params": {
                    "name": "policy_lease_revoke",
                    "arguments": {"lease_id": lease_id},
                },
            },
        ]
        out2 = io.StringIO()
        run_stdio_server(stdin=io.StringIO("\n".join(json.dumps(r) for r in reqs2) + "\n"), stdout=out2, broker=broker)
        res2 = [json.loads(line) for line in out2.getvalue().strip().splitlines()]
        self.assertTrue(res2[0]["result"]["structuredContent"]["allowed"])
        self.assertTrue(res2[1]["result"]["structuredContent"]["revoked"])

    def test_cli_subcommands_isolated(self) -> None:
        env = os.environ.copy()
        env["PYTHONPATH"] = str(REPO_ROOT / "src")
        env["AGENT_POLICY_DB"] = self.db_path
        env["AGENT_POLICY_SECRET"] = self.secret

        res = subprocess.run(
            [sys.executable, "-m", "agent_policy_auditor.cli", "--version"],
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertIn("2.6.0", res.stdout)

        # Grant via CLI
        res_g = subprocess.run(
            [
                sys.executable, "-m", "agent_policy_auditor.cli",
                "lease", "grant",
                "--agent", "cli_agent",
                "--cap", "FS_READ",
                "--target", "/tmp/cli/*",
                "--duration", "60",
                "--json",
            ],
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        lease_id = json.loads(res_g.stdout)["lease"]["lease_id"]

        # Verify via CLI
        res_v = subprocess.run(
            [
                sys.executable, "-m", "agent_policy_auditor.cli",
                "lease", "verify",
                "--lease", lease_id,
                "--cap", "FS_READ",
                "--target", "/tmp/cli/file.txt",
                "--json",
            ],
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertTrue(json.loads(res_v.stdout)["allowed"])

        # Audit file via CLI
        manifest_path = Path(self.temp_dir.name) / "sample.json"
        manifest_path.write_text(json.dumps({"tools": [{"name": "bash_exec"}]}), encoding="utf-8")
        res_a = subprocess.run(
            [sys.executable, "-m", "agent_policy_auditor.cli", "audit", "--file", str(manifest_path), "--json"],
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertEqual(json.loads(res_a.stdout)["risk_level"], "HIGH")


if __name__ == "__main__":
    unittest.main()
