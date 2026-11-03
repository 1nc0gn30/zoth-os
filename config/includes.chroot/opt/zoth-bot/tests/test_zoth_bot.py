import http.server
import json
import os
import sys
import threading
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server
from server import ZothBotHandler, SECURITY_RINGS, DEFAULT_HARNESSES


def test_security_rings_and_harnesses_invariants():
    assert len(SECURITY_RINGS) == 4
    assert SECURITY_RINGS[0]["name"] == "SOVEREIGN"
    assert SECURITY_RINGS[0]["active"] is True
    assert len(DEFAULT_HARNESSES) == 4
    harness_ids = {h["id"] for h in DEFAULT_HARNESSES}
    assert {"hermes", "grok", "ollama", "copilot"} == harness_ids


def test_http_endpoints_health_status_rings_and_mcp():
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), ZothBotHandler)
    port = httpd.server_port
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health") as r:
            health = json.loads(r.read().decode())
            assert health["ok"] is True
            assert health["tool"] == "zoth-bot"
            assert health["open_access"] is True

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/rings") as r:
            rings = json.loads(r.read().decode())
            assert rings["ok"] is True
            assert len(rings["rings"]) == 4

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/mcp") as r:
            mcp = json.loads(r.read().decode())
            assert mcp["ok"] is True
            assert "mcp_servers" in mcp
    finally:
        httpd.shutdown()
        httpd.server_close()
