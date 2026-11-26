"""Unit tests for PolicyBroker and Capability Leasing security invariants."""

from __future__ import annotations

import os
import sqlite3
import tempfile
import unittest

from agent_policy_auditor.broker import PolicyBroker


class TestPolicyBroker(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = f"{self.temp_dir.name}/test_policy.db"
        self.broker = PolicyBroker(db_path=self.db_path, secret_key="unit-test-secret-key-abcdef012345")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_grant_and_verify_valid_lease(self) -> None:
        lease = self.broker.grant_lease(
            agent_id="test_agent",
            capability="FS_READ",
            target="~/NullAITech/*",
            duration_sec=60.0,
        )
        self.assertTrue(lease.is_valid())
        self.assertTrue(lease.lease_id.startswith("lease_"))

        allowed, reason = self.broker.verify_action(
            lease_id=lease.lease_id,
            capability="FS_READ",
            target="~/NullAITech/project",
        )
        self.assertTrue(allowed)
        self.assertIn("Authorized", reason)

    def test_path_traversal_strictly_blocked(self) -> None:
        lease = self.broker.grant_lease(
            agent_id="fs_agent",
            capability="FS_WRITE",
            target="/tmp/work/*",
            duration_sec=60.0,
        )
        allowed, _ = self.broker.verify_action(lease.lease_id, "FS_WRITE", "/tmp/work/a.txt")
        self.assertTrue(allowed)

        # Traversal escape MUST be blocked
        allowed, reason = self.broker.verify_action(lease.lease_id, "FS_WRITE", "/tmp/work/../../etc/passwd")
        self.assertFalse(allowed)
        self.assertIn("PathTraversalBlocked", reason)

        # Single wildcard '*' must not cross subdirectories
        allowed, _ = self.broker.verify_action(lease.lease_id, "FS_WRITE", "/tmp/work/sub/deep.txt")
        self.assertFalse(allowed)

        # Double wildcard '**' allows nested subdirectories, still blocks '..'
        lease_deep = self.broker.grant_lease("fs_agent", "FS_WRITE", "/tmp/work/**", 60.0)
        allowed, _ = self.broker.verify_action(lease_deep.lease_id, "FS_WRITE", "/tmp/work/sub/deep.txt")
        self.assertTrue(allowed)
        allowed, _ = self.broker.verify_action(lease_deep.lease_id, "FS_WRITE", "/tmp/work/sub/../../../etc/shadow")
        self.assertFalse(allowed)

    def test_invalid_inputs_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.broker.grant_lease("a", "BOGUS_CAP", "/tmp/*")
        with self.assertRaises(ValueError):
            self.broker.grant_lease("a", "FS_READ", "/tmp/*", duration_sec=-60)
        with self.assertRaises(ValueError):
            self.broker.grant_lease("a", "FS_READ", "/tmp/*", duration_sec=999999)
        with self.assertRaises(ValueError):
            self.broker.grant_lease("a", "FS_READ", "/tmp/*", max_budget_usd=-5.0)
        with self.assertRaises(ValueError):
            self.broker.grant_lease("a", "FS_READ", "/tmp/work/../../etc/*")

        lease = self.broker.grant_lease("a", "TOKEN_BUDGET", "openai", 60.0, max_budget_usd=1.0)
        with self.assertRaises(ValueError):
            self.broker.verify_action(lease.lease_id, "TOKEN_BUDGET", "openai", cost_usd=-10.0)
        with self.assertRaises(ValueError):
            self.broker.verify_action(lease.lease_id, "TOKEN_BUDGET", "openai", cost_usd=float("nan"))

    def test_hmac_detects_budget_tampering(self) -> None:
        lease = self.broker.grant_lease("finance", "TOKEN_BUDGET", "openai", 60.0, max_budget_usd=1.0)
        # Tamper max_budget_usd directly in SQLite
        conn = sqlite3.connect(self.db_path)
        conn.execute("UPDATE leases SET max_budget_usd = 9999.0 WHERE lease_id = ?", (lease.lease_id,))
        conn.commit()
        conn.close()

        allowed, reason = self.broker.verify_action(lease.lease_id, "TOKEN_BUDGET", "openai", cost_usd=0.10)
        self.assertFalse(allowed)
        self.assertIn("TamperedSignature", reason)

    def test_verify_capability_mismatch(self) -> None:
        lease = self.broker.grant_lease("test_agent", "FS_READ", "*")
        allowed, reason = self.broker.verify_action(lease.lease_id, "FS_WRITE", "~/file.txt")
        self.assertFalse(allowed)
        self.assertIn("CapabilityMismatch", reason)

    def test_verify_target_mismatch(self) -> None:
        lease = self.broker.grant_lease("test_agent", "NET_EGRESS", "api.nullai.tech")
        allowed, reason = self.broker.verify_action(lease.lease_id, "NET_EGRESS", "malicious-site.com")
        self.assertFalse(allowed)
        self.assertIn("TargetNotPermitted", reason)

    def test_lease_revocation(self) -> None:
        lease = self.broker.grant_lease("test_agent", "SHELL_EXEC", "*")
        self.broker.revoke_lease(lease.lease_id)
        allowed, reason = self.broker.verify_action(lease.lease_id, "SHELL_EXEC", "ls")
        self.assertFalse(allowed)
        self.assertIn("LeaseRevoked", reason)

    def test_emergency_killswitch_per_agent_and_global(self) -> None:
        self.broker.grant_lease("agent_x", "FS_READ", "*")
        self.broker.grant_lease("agent_x", "FS_WRITE", "*")
        self.broker.grant_lease("agent_y", "FS_READ", "*")

        # Second broker instance verifying cross-process _load_from_db() before revoke_all_for_agent
        broker2 = PolicyBroker(db_path=self.db_path, secret_key="unit-test-secret-key-abcdef012345")
        revoked_count = broker2.revoke_all_for_agent("agent_x")
        self.assertEqual(revoked_count, 2)

        active = self.broker.get_active_leases()
        self.assertEqual(len(active), 1)
        self.assertEqual(active[0]["agent_id"], "agent_y")

        # Global kill-switch revokes remaining leases across all agents
        self.broker.grant_lease("agent_z", "NET_EGRESS", "example.com")
        global_revoked = self.broker.revoke_all_leases()
        self.assertEqual(global_revoked, 2)
        self.assertEqual(len(self.broker.get_active_leases()), 0)

    def test_budget_quota_enforcement_and_audit_events(self) -> None:
        lease = self.broker.grant_lease("finance_agent", "TOKEN_BUDGET", "openai", max_budget_usd=0.05)
        allowed, _ = self.broker.verify_action(lease.lease_id, "TOKEN_BUDGET", "openai", cost_usd=0.02)
        self.assertTrue(allowed)

        allowed, reason = self.broker.verify_action(lease.lease_id, "TOKEN_BUDGET", "openai", cost_usd=0.04)
        self.assertFalse(allowed)
        self.assertIn("BudgetExceeded", reason)

        events = self.broker.get_audit_events(limit=10)
        types = {e["event_type"] for e in events}
        self.assertIn("LEASE_GRANTED", types)
        self.assertIn("ACTION_ALLOWED", types)
        self.assertIn("ACTION_DENIED", types)
        self.assertEqual(os.stat(self.db_path).st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
