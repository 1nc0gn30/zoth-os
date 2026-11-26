"""Origin & Host header guard tests (CSRF & DNS rebinding protection)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
from agent_voice_call.server import _is_local_host, _is_local_origin


class TestOriginGuard(unittest.TestCase):
    def test_allowed_origins(self):
        for o in (
            None,
            "",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:8114",
            "http://localhost:3000",
            "https://localhost",
            "http://[::1]:1",
            "http://[::1]:8114",
        ):
            self.assertTrue(_is_local_origin(o), f"Expected allowed: {o!r}")

    def test_blocked_origins_including_port_suffix_bypass(self):
        for o in (
            "https://evil.example",
            "null",
            "http://127.0.0.1.evil.com",
            "http://127.0.0.1:8114.example.invalid",
            "http://127.0.0.1:18114.example.invalid",
            "http://localhost:8114.attacker.test",
            "http://user:pass@127.0.0.1:8114",
            "http://127.0.0.1:8114/extra/path",
            "file://",
            "chrome-extension://abc",
        ):
            self.assertFalse(_is_local_origin(o), f"Expected blocked: {o!r}")

    def test_host_header_allowlist(self):
        for h in (None, "", "127.0.0.1:8114", "127.0.0.1", "localhost:8114", "localhost", "[::1]:8114", "[::1]"):
            self.assertTrue(_is_local_host(h), f"Expected allowed host: {h!r}")
        for h in (
            "evil.example:8114",
            "127.0.0.1:8114.evil.example",
            "127.0.0.1.evil.example",
            "attacker@127.0.0.1:8114",
            "127.0.0.1:notaport",
        ):
            self.assertFalse(_is_local_host(h), f"Expected blocked host: {h!r}")


if __name__ == "__main__":
    unittest.main()
