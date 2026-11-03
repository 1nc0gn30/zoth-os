import http.server
import json
import subprocess
import threading
import urllib.request
from server import SceneFoundryHandler

def test_scene_foundry_http_endpoints():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), SceneFoundryHandler)
    port = srv.server_port
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=5) as r:
            assert r.status == 200
            h = json.loads(r.read().decode())
            assert h["ok"] is True
            assert h["tool"] == "zoth-scene-foundry"

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=5) as r:
            assert r.status == 200
            s = json.loads(r.read().decode())
            assert s["ok"] is True
            assert s["total_scenes"] >= 1000
            assert "gold" in s["tubes"]
    finally:
        srv.shutdown()
        srv.server_close()

def test_scene_foundry_cli_synthesis_and_tubes():
    res1 = subprocess.run(
        ["/root/.local/bin/zoth-scene-foundry", "--synthesize", "42"],
        capture_output=True, text=True, check=True
    )
    assert "ZOTH SCENE FOUNDRY #42" in res1.stdout
    assert "BAYER 8x8 DITHER MATRIX" in res1.stdout

    res2 = subprocess.run(
        ["/root/.local/bin/zoth-scene-foundry", "--tubes"],
        capture_output=True, text=True, check=True
    )
    assert "aurum_gold" in res2.stdout
    assert "cyber_cyan" in res2.stdout
