#!/usr/bin/env python3
"""
ZothOS Local Cockpit Daemon (:8137)
Provides health checks, system metrics, desktop workspace status, and serves the web workbench.
"""
import sys, os, json, http.server, socketserver, argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"

class ZothOSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        if self.path in ("/health", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            payload = {
                "status": "healthy",
                "service": "zoth-os",
                "version": "3.4.0",
                "sovereign": True,
                "desktop": "KDE Plasma 6.3 (Debian 13 Trixie)",
                "virtual_desktops": 8,
                "monitors_detected": 1
            }
            self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))
            return
        elif self.path in ("/api/status", "/status"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            payload = {
                "os": "ZothOS Sovereign Linux",
                "version": "3.4.0",
                "kernel": os.uname().release,
                "arch": os.uname().machine,
                "binary": "/usr/local/bin/zoth-os",
                "port": 8137
            }
            self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))
            return
        return super().do_GET()

def main():
    parser = argparse.ArgumentParser(description="ZothOS Local Cockpit Daemon")
    parser.add_argument("--port", type=int, default=8137)
    parser.add_argument("--host", default="127.0.0.1")
    args, _ = parser.parse_known_args()

    class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    print(f"Launching ZothOS Local Cockpit on http://{args.host}:{args.port} ...")
    with ThreadedServer((args.host, args.port), ZothOSRequestHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    main()
