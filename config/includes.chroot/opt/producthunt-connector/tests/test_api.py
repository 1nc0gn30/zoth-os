"""Local cockpit health without a Product Hunt token."""

from __future__ import annotations

import json
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer

from producthunt_connector.cockpit import Handler


class CockpitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.port = cls.httpd.server_address[1]
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.httpd.shutdown()

    def test_health(self) -> None:
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/health", timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "producthunt-connector")

    def test_home_renders(self) -> None:
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/", timeout=3) as resp:
            html = resp.read().decode("utf-8")
        self.assertIn("Keep the listing honest", html)
        self.assertIn("developer_token", html)


if __name__ == "__main__":
    unittest.main()
