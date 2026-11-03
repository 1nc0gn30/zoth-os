#!/usr/bin/env python3
"""
Zela Glasses Guide — Sovereign Wearable AI Mission Coach Local Server
Serves static workstation assets and provides live health, status, and config endpoints on port 8144.
"""

import argparse
import http.server
import json
import os
import sys
from pathlib import Path

DEFAULT_PORT = 8144
DEFAULT_HOST = "127.0.0.1"
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

SCENES = [
    {"id": "s1", "name": "Bicycle Repair / Mechanical Diagnosis", "category": "Repair", "model": "moondream"},
    {"id": "s2", "name": "PCB Soldering & SMD Inspection", "category": "Hardware", "model": "moondream"},
    {"id": "s3", "name": "Kitchen Recipe & Nutrition Step-by-Step", "category": "Daily", "model": "moondream"},
    {"id": "s4", "name": "Real-time Live Audio Steganography", "category": "Security", "model": "moondream"},
    {"id": "s5", "name": "Server Rack Patch & Cable Routing", "category": "DevOps", "model": "moondream"},
    {"id": "s6", "name": "Autonomous Navigation & Hazard Audio Cues", "category": "Mobility", "model": "moondream"}
]

CONFIG_YAML = """# ~/.config/zoth-relay/mobile/config.yaml (zoth-pill v0.5.0)
hosts:
  - 127.0.0.1
  - 100.106.132.5
port: 8766
agents_file: ~/.config/zoth-relay/mobile/agents.yaml
audit_log: ~/.local/state/zoth-relay-mobile/audit.log
guide:
  max_tokens: 80
  transcript_len: 12
  local_vision:
    base_url: http://127.0.0.1:11434
    model: moondream
    num_thread: 4
    keep_alive: 10m
    hot_c: 88
  agy:
    command: ~/.local/bin/agy
    effort: low
    timeout: 30
  stream:
    batch_interval: 3.0
    caption_interval: 1.5
    nudge_after: 12.0
    roll_turns: 14
    roll_chars: 6000
    chunk_ms: 200
  tts:
    engine: kokoro
    model: ~/.local/share/zoth-tts/kokoro-v1.0.onnx
    voices: ~/.local/share/zoth-tts/voices-v1.0.bin
    voice: af_heart
    speed: 1.1
    threads: 3
"""

class ZelaGuideHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        if clean_path in ("/health", "/api/health"):
            self._send_json({
                "ok": True,
                "status": "healthy",
                "tool": "zela-glasses-guide",
                "version": "0.5.0",
                "engine": "Zoth Relay Mobile Bridge",
                "port": self.server.server_port,
                "open_access": True
            })
            return

        if clean_path == "/api/status":
            self._send_json({
                "ok": True,
                "tool": "zela-glasses-guide",
                "version": "0.5.0",
                "name": "Zela Glasses Guide",
                "mode": "Sovereign Wearable AI Mission Coach",
                "tailscale_ip": "100.106.132.5",
                "relay_port": 8766,
                "vision_engine": "moondream (local via Ollama :11434)",
                "tts_engine": "kokoro v1.0 ONNX (24kHz neural)",
                "scenes_count": len(SCENES),
                "pricing": "100% Free & Open-Access",
                "support": {
                    "stripe": "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X",
                    "solana": "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
                }
            })
            return

        if clean_path == "/api/presets":
            self._send_json({"ok": True, "presets": SCENES})
            return

        if clean_path == "/api/config":
            self._send_json({"ok": True, "yaml": CONFIG_YAML})
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
        # Concise logging
        if sys.stderr.isatty():
            super().log_message(format, *args)


def run_server(host=DEFAULT_HOST, port=DEFAULT_PORT):
    server = http.server.ThreadingHTTPServer((host, port), ZelaGuideHandler)
    print(f"🚀 Zela Glasses Guide running at http://{host}:{port} (serving {PUBLIC_DIR})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Zela Glasses Guide server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zela Glasses Guide Workstation Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Host to bind (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to bind (default: {DEFAULT_PORT})")
    args = parser.parse_args()
    run_server(args.host, args.port)
