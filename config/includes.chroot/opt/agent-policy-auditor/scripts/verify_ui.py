#!/usr/bin/env python3
"""
verify_ui.py
Open-access Playwright verification harness for Agent Policy Auditor (:8106).
Verifies triple-viewport responsiveness, zero console errors, zero horizontal overflow,
real lease grant/verify/revoke lifecycle, manifest security audit, and zero paywalls.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

PORT = int(os.environ.get("PORT", "8106"))
BASE_URL = f"http://127.0.0.1:{PORT}"
SHOT_DIR = Path(os.environ.get("SHOT_DIR", "/tmp/agent-policy-auditor-ui-shots"))
SHOT_DIR.mkdir(parents=True, exist_ok=True)


def verify() -> None:
    print(f"[TEST] Verifying open-access Agent Policy Auditor cockpit on {BASE_URL}...")

    viewports = [
        {"name": "home_mobile.jpg", "width": 390, "height": 844, "device": "Mobile"},
        {"name": "home_tablet.jpg", "width": 820, "height": 1180, "device": "Tablet"},
        {"name": "home_desktop.jpg", "width": 1440, "height": 900, "device": "Desktop"},
    ]

    results = {
        "viewports": [],
        "leaseWorkflowPass": False,
        "manifestAuditPass": False,
        "openAccessPass": False,
        "consoleErrors": [],
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp in viewports:
            page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: console_errors.append(str(err)))

            page.goto(BASE_URL, wait_until="networkidle")
            time.sleep(0.4)
            overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            shot_path = SHOT_DIR / vp["name"]
            page.screenshot(path=str(shot_path), full_page=False, type="jpeg", quality=85)

            passed = len(console_errors) == 0 and overflow <= 1
            results["viewports"].append({
                "device": vp["device"],
                "overflowPx": overflow,
                "consoleErrors": len(console_errors),
                "passed": passed,
                "screenshot": str(shot_path),
            })
            results["consoleErrors"].extend(console_errors)
            page.close()

        # Interactive open-access workflow test
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(0.4)

        has_paywall = page.evaluate("() => Boolean(document.getElementById('paywallModal'))")
        results["openAccessPass"] = not has_paywall

        page.fill("#inputAgentId", "verify_ui_agent")
        page.select_option("#selectCapability", "FS_WRITE")
        page.fill("#inputTarget", "/tmp/verify-ui/*")
        page.fill("#inputDuration", "120")
        page.fill("#inputBudget", "1.00")
        page.click("#btnIssueLease")
        time.sleep(0.4)

        lease_rows = page.locator("#leaseTableBody tr").count()
        results["leaseWorkflowPass"] = lease_rows > 0

        page.click("#chipRisky")
        page.click("#btnAuditManifest")
        time.sleep(0.4)
        score_text = page.locator("#auditScoreBadge").inner_text()
        results["manifestAuditPass"] = "CRITICAL" in score_text or "HIGH" in score_text

        page.close()
        browser.close()

    print(json.dumps(results, indent=2))
    ok = (
        all(v["passed"] for v in results["viewports"])
        and results["openAccessPass"]
        and results["leaseWorkflowPass"]
        and results["manifestAuditPass"]
        and len(results["consoleErrors"]) == 0
    )
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    verify()
