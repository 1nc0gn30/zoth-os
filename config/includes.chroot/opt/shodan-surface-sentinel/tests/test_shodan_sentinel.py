import json
import subprocess
import sys
import threading
import time
import urllib.request
from http.server import HTTPServer
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import server


def test_resolve_target_valid_ipv4():
    ip, err = server.resolve_target("127.0.0.1")
    assert err is None
    assert ip == "127.0.0.1"


def test_resolve_target_strips_url_and_port():
    ip, err = server.resolve_target("https://127.0.0.1:8130/api/scan")
    assert err is None
    assert ip == "127.0.0.1"


def test_resolve_target_empty():
    ip, err = server.resolve_target("   ")
    assert ip is None
    assert "Empty target" in err


def test_common_ports_dictionary():
    assert server.COMMON_PORTS[22] == "SSH"
    assert server.COMMON_PORTS[80] == "HTTP"
    assert server.COMMON_PORTS[443] == "HTTPS"
    assert server.COMMON_PORTS[2375] == "Docker"
    assert server.COMMON_PORTS[11434] == "Ollama-AI"


def test_http_server_health_and_local_scan():
    httpd = HTTPServer(("127.0.0.1", 0), server.SurfaceSentinelHandler)
    port = httpd.server_port
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    try:
        # 1. Health endpoint
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=3) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            assert data["status"] == "healthy"
            assert data["service"] == "shodan-surface-sentinel"

        # 2. Local enclave scan endpoint
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/scan?target=127.0.0.1", timeout=3) as resp:
            assert resp.status == 200
            scan = json.loads(resp.read().decode("utf-8"))
            assert scan["ip"] == "127.0.0.1"
            assert scan["is_local_enclave"] is True
            assert scan["threat_level"] == "SECURE"
            assert 8130 in scan["ports"]
            assert len(scan["vulns"]) == 0

        # 3. Root HTML workstation
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=3) as resp:
            assert resp.status == 200
            html = resp.read().decode("utf-8")
            assert "Shodan Attack Surface Sentinel" in html
            assert "100% FREE &amp; OPEN ACCESS" in html
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_cli_help_and_local_scan():
    res_help = subprocess.run(
        ["/root/.local/bin/shodan-surface-sentinel", "--help"],
        capture_output=True,
        text=True,
        timeout=5,
    )
    assert res_help.returncode == 0
    assert "Shodan Attack Surface Sentinel" in res_help.stdout

    res_scan = subprocess.run(
        ["/root/.local/bin/shodan-surface-sentinel", "scan", "127.0.0.1", "--json"],
        capture_output=True,
        text=True,
        timeout=8,
    )
    assert res_scan.returncode == 0
    payload = json.loads(res_scan.stdout)
    assert payload["ip"] == "127.0.0.1"
    assert payload["threat_level"] == "SECURE"
