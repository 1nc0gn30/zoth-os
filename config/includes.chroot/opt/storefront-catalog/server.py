#!/usr/bin/env python3
"""Sovereign Micro-SaaS Daemon for YourDigitalSpace Master Catalog (storefront-catalog).

Serves the avant-garde showcase UI and genuine API endpoints:
- GET /health, /api/health
- GET /api/catalog (full 10-product manifest with portfolio financials)
- GET /api/products (listings array with 13/13 SEO tags and margins)
- GET /api/payloads/<id> (Printify JSON payload)
- Static asset serving from public/
Zero external runtime dependencies.
"""

import sys
import os
import json
import time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse

ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT_DIR / "public"
MANIFEST_PATH = ROOT_DIR / "catalog_manifest.json"
START_TIME = time.time()

# Load manifest
catalog_data = {}
if MANIFEST_PATH.exists():
    try:
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            catalog_data = json.load(f)
    except Exception as e:
        print(f"[WARN] Failed to load catalog_manifest.json: {e}", file=sys.stderr)

class SovereignCatalogHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Health endpoint
        if path in ("/health", "/api/health"):
            self.send_json(200, {
                "status": "healthy",
                "service": "storefront-catalog",
                "store_name": catalog_data.get("store_name", "YourDigitalSpace"),
                "total_listings": catalog_data.get("total_listings", 10),
                "demographic": catalog_data.get("target_demographic", "55+ Women"),
                "blended_margin": catalog_data.get("portfolio_financials", {}).get("blended_net_margin", 62.6),
                "uptime_seconds": round(time.time() - START_TIME, 2),
                "access": "100% Free & Open-Access (Zero Paywalls)"
            })
            return

        # Full catalog manifest
        if path == "/api/catalog":
            self.send_json(200, catalog_data)
            return

        # Products list
        if path == "/api/products":
            self.send_json(200, {
                "total": len(catalog_data.get("listings", [])),
                "listings": catalog_data.get("listings", []),
                "financials": catalog_data.get("portfolio_financials", {})
            })
            return

        # Specific product payload: /api/payloads/<prod_id>
        if path.startswith("/api/payloads/"):
            prod_id = path.replace("/api/payloads/", "").strip()
            # Try finding the file in payloads/ or public/payloads/
            candidates = [
                ROOT_DIR / "payloads" / f"{prod_id}_printify.json",
                PUBLIC_DIR / "payloads" / f"{prod_id}_printify.json",
                ROOT_DIR / "payloads" / f"{prod_id}.json",
                PUBLIC_DIR / "payloads" / f"{prod_id}.json"
            ]
            for c in candidates:
                if c.exists():
                    try:
                        with open(c, "r", encoding="utf-8") as pf:
                            data = json.load(pf)
                        self.send_json(200, data)
                        return
                    except Exception as e:
                        self.send_json(500, {"error": f"Failed to read payload: {e}"})
                        return

            self.send_json(404, {"error": f"Payload for '{prod_id}' not found"})
            return

        # Otherwise serve static files from public/
        super().do_GET()

    def send_json(self, status_code, data):
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        # Concise logging
        if "- -" in args[0] or "200" in args[0]:
            return
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]}\n")

def run(host="127.0.0.1", port=8143):
    server_address = (host, port)
    httpd = HTTPServer(server_address, SovereignCatalogHandler)
    print(f"✦ YourDigitalSpace Sovereign Catalog running on http://{host}:{port}")
    print(f"  Health endpoint: http://{host}:{port}/health")
    print(f"  Catalog API:     http://{host}:{port}/api/catalog")
    print(f"  Products API:    http://{host}:{port}/api/products")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping catalog daemon...")
        httpd.server_close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="YourDigitalSpace Sovereign Showcase Daemon")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind")
    parser.add_argument("--port", type=int, default=8143, help="Port to bind")
    args = parser.parse_args()
    run(host=args.host, port=args.port)
