"""Only local pages (and zoth.nullai.tech) may call this server from a browser."""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
from agent_mock_twin.mock_server import _is_allowed_host, _is_local_origin


class TestOriginGuard(unittest.TestCase):
    def test_allowed(self):
        for o in (
            None,
            "",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:8097",
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://[::1]:1",
            "https://zoth.nullai.tech",
        ):
            self.assertTrue(_is_local_origin(o), o)

    def test_blocked(self):
        for o in (
            "https://evil.example",
            "null",
            "http://127.0.0.1.evil.com",
            "http://127.0.0.1:8097.example.invalid",
            "http://localhost:3000.attacker.test",
            "http://127.0.0.1:99999",
            "http://127.0.0.1:0",
            "http://127.0.0.1:8097/path",
            "file://",
            "chrome-extension://abc",
        ):
            self.assertFalse(_is_local_origin(o), o)

    def test_host_guard(self):
        self.assertTrue(_is_allowed_host("127.0.0.1:8097", bound_port=8097))
        self.assertTrue(_is_allowed_host("localhost:8097", bound_port=8097))
        self.assertTrue(_is_allowed_host("[::1]:8097", bound_port=8097))
        self.assertTrue(_is_allowed_host("127.0.0.1", bound_port=8097))
        self.assertFalse(_is_allowed_host("evil.example:8097", bound_port=8097))
        self.assertFalse(_is_allowed_host("127.0.0.1:8097.evil.test", bound_port=8097))


if __name__ == "__main__":
    unittest.main()
