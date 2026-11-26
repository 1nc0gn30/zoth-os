#!/usr/bin/env python3
"""
verify_ui.py: Lightweight HTTP & DOM hygiene smoke verifier for Agent Mock Twin (:8097).
Zero external dependencies (Python 3.10+ stdlib).
"""

import argparse
import json
import sys
import urllib.request


def verify(port: int) -> int:
    base = f"http://127.0.0.1:{port}"
    checks = []

    # 1. Health endpoint
    with urllib.request.urlopen(f"{base}/health", timeout=3) as resp:
        health = json.loads(resp.read().decode("utf-8"))
        assert resp.status == 200
        assert health.get("service") == "agent-mock-twin"
        assert health.get("version") == "2.6.0"
        assert "routes_count" in health and "saved_dollars" in health
        checks.append(("health", True))

    # 2. Index HTML open-access & zero paywall invariants
    with urllib.request.urlopen(f"{base}/", timeout=3) as resp:
        html = resp.read().decode("utf-8")
        assert resp.status == 200
        assert "Access-Control-Allow-Origin" not in resp.headers
        assert "proModal" not in html and "MOCK-PRO-2026" not in html
        assert "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X" in html
        assert "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK" in html
        assert "fonts.googleapis.com" not in html
        assert "sovereign-upgrade.js" not in html
        checks.append(("index_html", True))

    # 3. Robots & sitemap
    with urllib.request.urlopen(f"{base}/robots.txt", timeout=3) as resp:
        robots = resp.read().decode("utf-8")
        assert "https://agent-mock-twin.nullai.tech/sitemap.xml" in robots
        checks.append(("robots", True))

    with urllib.request.urlopen(f"{base}/sitemap.xml", timeout=3) as resp:
        sitemap = resp.read().decode("utf-8")
        assert "https://agent-mock-twin.nullai.tech/" in sitemap
        checks.append(("sitemap", True))

    print(json.dumps({"port": port, "ok": True, "checks": checks}, indent=2))
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify Agent Mock Twin HTTP & UI invariants")
    parser.add_argument("--port", type=int, default=8097)
    args = parser.parse_args()
    sys.exit(verify(args.port))
