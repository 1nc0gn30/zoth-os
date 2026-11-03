---
title: SubSweep Lead Scanner
category: studio-tool
tags: [tool, studio, subsweep-lead-scanner, verified, 12-step-walkthrough]
port: 8058
domain: subsweep-lead.nullai.tech
repo: ~/NullAITech/subsweep-lead-scanner
updated: 2026-10-31
---

# SubSweep Lead Scanner (`subsweep-lead-scanner`)

> **Autonomous Subdomain & Attack Surface Recon Engine** — Concurrent DNS + Certificate Transparency (`crt.sh`) subdomain enumerator, live HTTP header & technology fingerprinter, CNAME takeover vulnerability detector, and scored B2B security audit lead generator (`0-100`).

---

## Architecture & Verification Summary

- **Repository**: `~/NullAITech/subsweep-lead-scanner`
- **Standalone Workstation**: `http://127.0.0.1:8058` (`subsweep-lead.nullai.tech`)
- **Zoth Studio v2 God-Mode Route**: `http://127.0.0.1:3000/tools/subsweep-lead-scanner`
- **Global CLI Binaries**: `/usr/local/bin/subsweep-lead-scanner` & `~/.local/bin/subsweep-lead-scanner`
- **Automated Test Suite**: `147 passed in 4.44s` (`pytest -v`)
- **Open-Access Guarantee**: 100% unlocked in-browser and CLI functionality — zero paywall blur filters, zero license modals, zero Solana Tip scripts; includes optional Stripe Coffee (`https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X`) and Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## Step-by-Step Developer & End-User Walkthrough (12 Verified Screenshots)

### Step 1: Developer Repository Architecture & Entrypoints
Inspecting `~/NullAITech/subsweep-lead-scanner` directory tree, `pyproject.toml`, `src/subsweep_lead_scanner/` (`cli.py`, `scanner.py`, `ui_server.py`, `mcp_server.py`), and `public/index.html`.

![Step 1: Developer Repository Structure](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_01_dev_repo_structure.jpg)

---

### Step 2: Developer Automated Test Suite (`pytest -v`)
Running the full 147-test suite verifying Certificate Transparency (`crt.sh`) parsing, DNS resolution, dangling CNAME takeover signatures (GitHub Pages, S3, Heroku, Vercel, Azure), security header grading, lead scoring (`0-100`), path-traversal protection, and REST API endpoints.

![Step 2: Developer Pytest Verification](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_02_dev_pytest.jpg)

---

### Step 3: Developer REST API & Health Contract Verification
Querying `GET http://127.0.0.1:8058/health` and `POST http://127.0.0.1:8058/api/scan` (`{"domain": "acme-cloud.io"}`) to verify structured JSON subdomain discovery, dangling CNAME alerts, security grade (`D`), and cold outreach pitch generation.

![Step 3: Developer API Verification](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_03_dev_api_verify.jpg)

---

### Step 4: End-User CLI Installation & Help Matrix
Verifying global binary resolution (`which -a subsweep-lead-scanner`) across `~/.local/bin/subsweep-lead-scanner` and `/usr/local/bin/subsweep-lead-scanner`, plus inspecting the CLI command matrix (`--domain`, `--preset`, `--export`, `--json`, `--serve`).

![Step 4: End-User CLI Install & Help](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_04_user_cli_install_help.jpg)

---

### Step 5: End-User CLI Live Domain Recon (`--domain acme-cloud.io`)
Running `subsweep-lead-scanner --domain acme-cloud.io` to enumerate subdomains (`api.acme-cloud.io`, `staging.acme-cloud.io`, `dev-portal.acme-cloud.io`, `old-blog.acme-cloud.io`), detect dangling CNAME takeover risks, and compute the B2B Lead Opportunity Score (`92 / 100 — Grade D`).

![Step 5: End-User CLI Scan](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_05_user_cli_scan.jpg)

---

### Step 6: End-User CLI Preset Recon & Lead Report Export (`--preset saas --export`)
Running `subsweep-lead-scanner --preset saas --json` and exporting a Markdown security audit & cold outreach brief (`--preset ecommerce --export /tmp/subsweep_lead_report.md`).

![Step 6: End-User CLI Preset & Export](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_06_user_cli_preset_export.jpg)

---

### Step 7: Standalone Web Workstation (`:8058`) — Dark Mode Recon Matrix
Loading `http://127.0.0.1:8058` directly into the active 2-column Subdomain & Attack Surface Recon Engine showing Target Recon Configuration (`acme-cloud.io`), Industry Presets, Lead Opportunity Score (`95/100`), Security Grade (`F`), Discovered Subdomains & Attack Surface Matrix (`6 found`), and Cold Outreach Pitch Generator.

![Step 7: Standalone Dark Mode Workstation](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_07_gui_standalone_dark.jpg)

---

### Step 8: Standalone Web Workstation (`:8058`) — Interactive FinTech Preset & Takeover Filter
Clicking the **FinTech Vault (`fintech-vault.io`)** preset (`6 subdomains`, `94/100 Lead Score`, `1 Takeover Risk` on `legacy-pay.fintech-vault.io -> S3 Bucket`) and filtering the attack surface table by **Takeover Risk** and **Exposed Dev**.

![Step 8: Standalone Interactive FinTech Recon](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_08_gui_standalone_interact.jpg)

---

### Step 9: Standalone Web Workstation (`:8058`) — Editorial Light Mode
Toggling **☀️ Light Mode** (`html[data-theme="light"]`) to verify high-contrast warm alabaster cards (`#F8F6F0`), crisp dark ink typography (`#181612`), and clear status badges across the recon table and outreach pitch panel.

![Step 9: Standalone Light Mode](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_09_gui_standalone_light.jpg)

---

### Step 10: Zoth Studio v2 (`:3000`) — God-Mode Recon Cockpit
Opening `http://127.0.0.1:3000/tools/subsweep-lead-scanner` inside Zoth Studio v2 God-Mode with the live SubSweep workstation, bottom **CLI & ZothOS Terminal**, and right-hand **God-Mode Execution** drawer.

![Step 10: Zoth Studio v2 God-Mode View](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_10_gui_studio_godmode.jpg)

---

### Step 11: Zoth Studio v2 (`:3000`) — Executing Live God-Mode Subdomain Sweep
Executing a live `subsweep-lead-scanner` run from the Studio v2 God-Mode drawer and inspecting the real-time JSON output stream and CLI command recipes.

![Step 11: Zoth Studio v2 God-Mode Execution](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_11_gui_studio_action.jpg)

---

### Step 12: Mobile 390px Responsive Workstation Verification (`overflowPx: 0`)
Verifying `http://127.0.0.1:8058` at `390x844` mobile viewport with stacked cards, touch-friendly controls, and zero horizontal scroll overflow (`overflowPx === 0`).

![Step 12: Mobile 390px Responsive View](Artifacts/subsweep-lead-scanner/subsweep-lead-scanner_12_gui_mobile_390px.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/subsweep-lead-scanner"]
        TUI["/usr/local/bin/subsweep-lead-scanner-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8080<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/subsweep-lead-scanner<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio subsweep-lead-scanner.md"]
    end

    CLI --> WEB
    TUI --> WEB
    WEB <--> STUDIO
    WEB <--> LITE
    WEB --> TRACKER
    TRACKER <--> VAULT
    VAULT <--> NEURO
```

### ZothOS v3.4 TUI & Obsidian Second Brain Sync
- **Unicode `U+2800` Braille TUI**: `subsweep-lead-scanner-tui --status` / `subsweep-lead-scanner-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
