#!/usr/bin/env python3
"""
Zoth Scene Foundry — Sovereign Procedural ASCII & Pixel Art Engine Server
Serves static workstation assets, gallery, and exposes health/telemetry endpoints on port 8823.
"""

import argparse
import http.server
import json
import os
import sys
from pathlib import Path

DEFAULT_PORT = 8823
DEFAULT_HOST = "127.0.0.1"
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
OUT_DIR = BASE_DIR / "out"

class SceneFoundryHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        if clean_path in ("/health", "/api/health"):
            self._send_json({
                "ok": True,
                "status": "healthy",
                "tool": "zoth-scene-foundry",
                "version": "1.0.0",
                "port": self.server.server_port,
                "open_access": True
            })
            return

        if clean_path == "/api/status":
            index_path = OUT_DIR / "index.json"
            total = 1000
            if index_path.exists():
                try:
                    with open(index_path, "r") as f:
                        idx_data = json.load(f)
                        if isinstance(idx_data, dict):
                            total = idx_data.get("total", len(idx_data.get("scenes", [])))
                        else:
                            total = len(idx_data)
                except Exception:
                    pass
            self._send_json({
                "ok": True,
                "tool": "zoth-scene-foundry",
                "name": "Zoth Scene Foundry",
                "version": "1.0.0",
                "category": "Media & 3D",
                "port": self.server.server_port,
                "total_scenes": total,
                "engine": "Deterministic Bayer Dither + Three.js AsciiEffect",
                "tubes": ["gold", "amber", "cyan", "emerald", "crimson", "obsidian"],
                "pricing": "100% Free & Open-Access",
                "support": {
                    "stripe": "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X",
                    "solana": "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
                }
            })
            return

        if clean_path == "/api/scenes":
            index_path = OUT_DIR / "index.json"
            if index_path.exists():
                try:
                    with open(index_path, "r") as f:
                        data = json.load(f)
                    scenes_list = data.get("scenes", []) if isinstance(data, dict) else data
                    self._send_json({"ok": True, "total": len(scenes_list), "scenes": scenes_list[:10]})
                    return
                except Exception:
                    pass
            self._send_json({"ok": True, "total": 0, "scenes": []})
            return

        super().do_GET()

    def _send_json(self, data, code=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        if sys.stderr.isatty():
            super().log_message(format, *args)


def run_server(host=DEFAULT_HOST, port=DEFAULT_PORT):
    server = http.server.ThreadingHTTPServer((host, port), SceneFoundryHandler)
    print(f"🎨 Zoth Scene Foundry running at http://{host}:{port} (serving {PUBLIC_DIR})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Zoth Scene Foundry server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zoth Scene Foundry Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Host to bind (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to bind (default: {DEFAULT_PORT})")
    args = parser.parse_args()
    run_server(args.host, args.port)
