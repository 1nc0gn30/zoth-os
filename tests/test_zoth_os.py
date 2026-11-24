import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ZOTH_OS_BIN = os.path.expanduser("~/.local/bin/zoth-os")
if not os.path.exists(ZOTH_OS_BIN):
    ZOTH_OS_BIN = os.path.join(REPO_ROOT, "config/includes.chroot/usr/local/bin/zoth-os")

def _is_daemon_up(port=8137):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1) as r:
            if r.status != 200:
                return False
            data = json.loads(r.read().decode())
            return data.get("service") == "zoth-os"
    except Exception:
        return False

def _port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex(("127.0.0.1", port)) == 0

def _free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

def test_zoth_os_daemon_health_and_status():
    proc = None
    port = 8137
    if not _is_daemon_up(port):
        if _port_in_use(port):
            port = _free_port()
        proc = subprocess.Popen(
            [sys.executable, os.path.join(REPO_ROOT, "server.py"), "--port", str(port)],
            cwd=REPO_ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(30):
            if _is_daemon_up(port):
                break
            time.sleep(0.1)

    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=5) as r:
            assert r.status == 200
            health = json.loads(r.read().decode())
            assert health.get("status") == "healthy"
            assert health.get("service") == "zoth-os"
            assert health.get("virtual_desktops") == 8

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=5) as r:
            assert r.status == 200
            status = json.loads(r.read().decode())
            assert status.get("version") == "3.4.0"
            assert status.get("port") in (port, 8137)
    finally:
        if proc is not None:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()

def test_zoth_os_cli_desktops_and_iso_audit():
    res1 = subprocess.run(
        ["python3", ZOTH_OS_BIN, "--desktops", "--json"],
        capture_output=True, text=True, check=True
    )
    d1 = json.loads(res1.stdout)
    assert d1.get("count") == 8
    assert len(d1.get("virtual_desktops", [])) == 8

    res2 = subprocess.run(
        ["python3", ZOTH_OS_BIN, "--audit-iso", "--json"],
        capture_output=True, text=True, check=True
    )
    d2 = json.loads(res2.stdout)
    assert d2.get("iso_version") == "3.4.0"
    assert d2.get("reproducible_build_ready") is True
