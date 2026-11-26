"""Strict local Origin & Host header guards against CSRF and DNS rebinding."""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
from agent_policy_auditor.web_cockpit import _is_local_host, _is_local_origin


class TestOriginAndHostGuard(unittest.TestCase):
    def test_origin_allowed(self) -> None:
        for o in (
            None,
            "",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:8106",
            "http://localhost:3000",
            "https://localhost:8443",
            "http://[::1]:1",
            "http://127.0.0.1",
        ):
            self.assertTrue(_is_local_origin(o), o)

    def test_origin_blocked(self) -> None:
        for o in (
            "https://evil.example",
            "null",
            "http://127.0.0.1.evil.com",
            "http://127.0.0.1:8106.example.invalid",
            "http://localhost:3000.attacker.test",
            "http://user@127.0.0.1:8106",
            "http://127.0.0.1:99999",
            "file://",
            "chrome-extension://abc",
        ):
            self.assertFalse(_is_local_origin(o), o)

    def test_host_header_guard(self) -> None:
        for h in (None, "", "127.0.0.1:8106", "localhost:8106", "[::1]:8106", "localhost"):
            self.assertTrue(_is_local_host(h), h)
        for h in ("evil.example:8106", "127.0.0.1.evil.com:8106", "127.0.0.1:8106.evil.com", "evil@127.0.0.1:8106"):
            self.assertFalse(_is_local_host(h), h)


if __name__ == "__main__":
    unittest.main()
