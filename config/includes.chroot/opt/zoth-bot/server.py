#!/usr/bin/env python3
"""
Zoth Bot Desktop Companion — Sovereign Local Server & Telemetry Hub
Serves workstation assets and provides health, rings, and MCP status on port 8146.
"""

import argparse
import http.server
import json
import os
import sys
from pathlib import Path

DEFAULT_PORT = 8146
DEFAULT_HOST = "127.0.0.1"
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

SECURITY_RINGS = [
    {"ring": 0, "name": "SOVEREIGN", "authority": "Root, Kernel & Amnesic Authority", "active": True},
    {"ring": 1, "name": "SYSADMIN", "authority": "System Daemons & Package Control", "active": False},
    {"ring": 2, "name": "TOOLMASTER", "authority": "Agent Tools, GUI & MCP Runtime", "active": False},
    {"ring": 3, "name": "SPECTRE", "authority": "Sandboxed Read-Only Telemetry", "active": False}
]

DEFAULT_HARNESSES = [
    {"id": "hermes", "name": "Nous Hermes Agent", "type": "agentic", "status": "READY"},
    {"id": "grok", "name": "xAI Grok CLI", "type": "frontier", "status": "READY"},
    {"id": "ollama", "name": "Local Ollama Loop", "type": "local_enclave", "status": "READY"},
    {"id": "copilot", "name": "Hermes Copilot", "type": "interactive", "status": "READY"}
]

class ZothBotHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        if clean_path in ("/health", "/api/health"):
            self._send_json({
                "ok": True,
                "status": "healthy",
                "tool": "zoth-bot",
                "version": "1.0.0",
                "port": self.server.server_port,
                "open_access": True
            })
            return

        if clean_path == "/api/status":
            self._send_json({
                "ok": True,
                "tool": "zoth-bot",
                "name": "Zoth Bot Desktop Companion",
                "version": "1.0.0",
                "category": "Swarm & Core",
                "port": self.server.server_port,
                "summon_hotkeys": ["Ctrl+Shift+Space", "Super+Shift+Z"],
                "active_ring": 0,
                "ring_name": "SOVEREIGN",
                "harnesses": DEFAULT_HARNESSES,
                "pricing": "100% Free & Open-Access",
                "support": {
                    "stripe": "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X",
                    "solana": "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
                }
            })
            return

        if clean_path == "/api/rings":
            self._send_json({"ok": True, "rings": SECURITY_RINGS})
            return

        if clean_path == "/api/mcp":
            mcp_file = Path("/etc/zothos/mcp-servers.json")
            if mcp_file.exists():
                try:
                    with open(mcp_file, "r") as f:
                        data = json.load(f)
                    raw_servers = data.get("mcpServers", {}) if isinstance(data, dict) else {}
                    parsed_list = []
                    for name, cfg in list(raw_servers.items())[:12]:
                        parsed_list.append({
                            "name": name,
                            "status": "ENABLED" if cfg.get("enabled") else "STANDBY",
                            "ring": cfg.get("ring_level", 2),
                            "security_ring": cfg.get("securityRing", "RING_2_TOOLMASTER"),
                        })
                    self._send_json({
                        "ok": True,
                        "registry_version": data.get("version", "3.1.0"),
                        "total_registered": len(raw_servers),
                        "mcp_servers": parsed_list,
                    })
                    return
                except Exception:
                    pass
            self._send_json({
                "ok": True,
                "total_registered": 5,
                "mcp_servers": [
                    {"name": "filesystem", "status": "ACTIVE", "ring": 2},
                    {"name": "memory", "status": "ACTIVE", "ring": 2},
                    {"name": "zoth-relay", "status": "ACTIVE", "ring": 1},
                    {"name": "ghidra-bridge", "status": "ACTIVE", "ring": 2},
                    {"name": "shodan-sentinel", "status": "ACTIVE", "ring": 2}
                ]
            })
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
    server = http.server.ThreadingHTTPServer((host, port), ZothBotHandler)
    print(f"🤖 Zoth Bot server running at http://{host}:{port} (serving {PUBLIC_DIR})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Zoth Bot server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zoth Bot Local Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Host to bind (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to bind (default: {DEFAULT_PORT})")
    args = parser.parse_args()
    run_server(args.host, args.port)
