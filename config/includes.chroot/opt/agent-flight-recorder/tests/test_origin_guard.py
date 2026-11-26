"""Only local pages (and https://zoth.nullai.tech) may call this server from a browser."""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
from agent_flight_recorder.server import _is_local_origin, _is_valid_host


class TestOriginGuard(unittest.TestCase):
    def test_allowed_origins(self):
        for o in (
            None,
            "",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:8104",
            "http://localhost:3000",
            "http://[::1]:1",
            "https://zoth.nullai.tech",
        ):
            self.assertTrue(_is_local_origin(o), o)

    def test_blocked_origins(self):
        for o in (
            "https://evil.example",
            "null",
            "http://127.0.0.1.evil.com",
            "http://127.0.0.1:8104.example.invalid",
            "http://localhost:3000.evil.example",
            "http://127.0.0.1:99999",
            "http://127.0.0.1:0",
            "http://127.0.0.1:8104/extra-path",
            "http://user@127.0.0.1:8104",
            "file://",
            "chrome-extension://abc",
        ):
            self.assertFalse(_is_local_origin(o), o)

    def test_host_validation(self):
        self.assertTrue(_is_valid_host("127.0.0.1:8104", 8104))
        self.assertTrue(_is_valid_host("localhost:8104", 8104))
        self.assertTrue(_is_valid_host("[::1]:8104", 8104))
        self.assertFalse(_is_valid_host("evil.example:8104", 8104))
        self.assertFalse(_is_valid_host("127.0.0.1:9999", 8104))


if __name__ == "__main__":
    unittest.main()
