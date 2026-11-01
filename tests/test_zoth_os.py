import json
import subprocess
import urllib.request

def test_zoth_os_daemon_health_and_status():
    with urllib.request.urlopen("http://127.0.0.1:8137/api/health", timeout=5) as r:
        assert r.status == 200
        health = json.loads(r.read().decode())
        assert health.get("status") == "healthy"
        assert health.get("service") == "zoth-os"
        assert health.get("virtual_desktops") == 8

    with urllib.request.urlopen("http://127.0.0.1:8137/api/status", timeout=5) as r:
        assert r.status == 200
        status = json.loads(r.read().decode())
        assert status.get("version") == "3.4.0"
        assert status.get("port") == 8137

def test_zoth_os_cli_desktops_and_iso_audit():
    res1 = subprocess.run(
        ["/home/zoth/.local/bin/zoth-os", "--desktops", "--json"],
        capture_output=True, text=True, check=True
    )
    d1 = json.loads(res1.stdout)
    assert d1.get("count") == 8
    assert len(d1.get("virtual_desktops", [])) == 8

    res2 = subprocess.run(
        ["/home/zoth/.local/bin/zoth-os", "--audit-iso", "--json"],
        capture_output=True, text=True, check=True
    )
    d2 = json.loads(res2.stdout)
    assert d2.get("iso_version") == "3.4.0"
    assert d2.get("reproducible_build_ready") is True
