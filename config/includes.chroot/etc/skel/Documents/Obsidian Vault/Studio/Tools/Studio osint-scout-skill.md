---
title: Domain Intel OSINT Scout
tool_id: osint-scout-skill
category: Security & Recon
local_port: 8085
studio_route: http://127.0.0.1:3000/tools/osint-scout-skill
repo_path: ~/NullAITech/osint-scout-skill
cli_binary: /usr/local/bin/osint-scout-skill
test_status: PASS (12-Step Gallery Verified)
open_access: true
last_verified: '2026-10-31'
tags:
- zoth-studio
- sovereign-arsenal
- security-recon
- osint-scout
- passive-dns
- verified-gallery
- tool
---

# Domain Intel OSINT Scout (`osint-scout-skill`)

> **100% Free & Open-Access Passive Domain Intelligence, DNS-over-HTTPS (DoH) Subdomain Reconnaissance, Certificate Transparency (CRT.SH) Discovery & SPF/DMARC Email Posture Auditor**
> - **Standalone Web Workstation**: `http://127.0.0.1:8085`
> - **Zoth Studio v2 God-Mode Route**: `http://127.0.0.1:3000/tools/osint-scout-skill`
> - **Global ZothOS CLI**: `osint-scout-skill` (`/usr/local/bin/osint-scout-skill` & `~/.local/bin/osint-scout-skill`)
> - **Support**: [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) · **Solana Tip**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Part I — Developer Perspective: Architecture, Automated Pytest Suite & REST API Contracts

### Step 01 — Repository Architecture & ZothOS Binary Parity
Inspecting `~/NullAITech/osint-scout-skill` structure (`server.py`, `SKILL.md`, `public/index.html`, `tests/test_osint_scout.py`) and verifying global CLI binary parity across `/usr/local/bin/osint-scout-skill` and `~/.local/bin/osint-scout-skill`.

![Step 01 — Developer Perspective: Repository Architecture & ZothOS Binary Parity](Artifacts/osint-scout-skill/osint-scout-skill_01_dev_repo_architecture.jpg)

### Step 02 — Automated Pytest Verification Suite (`9 passed`)
Running `pytest -v` across the 9-test verification suite covering `/health`, `/api/health`, `/api/recon` passive DNS resolution, CLI subcommands (`--help`, `--json`, `scan`), and AEO Schema.org / open-access invariants.

![Step 02 — Developer Perspective: Automated Pytest Verification Suite](Artifacts/osint-scout-skill/osint-scout-skill_02_dev_pytest_suite.jpg)

### Step 03 — Live HTTP REST API & Passive DNS Recon Contracts
Probing `/health` and `GET /api/recon?domain=nullai.tech` to verify real-time IPv4/IPv6 passive socket resolution (`75.2.60.5`, `99.83.231.61`).

![Step 03 — Developer Perspective: Live HTTP REST API & Passive DNS Recon Contracts](Artifacts/osint-scout-skill/osint-scout-skill_03_dev_api_contracts.jpg)

---

## Part II — End-User CLI Perspective: Passive Domain Reconnaissance & Agent SKILL.md

### Step 04 — Global CLI Help Matrix & Sovereign Telemetry Status
Executing `osint-scout-skill --help` and `osint-scout-skill --json` from the user's shell.

![Step 04 — User CLI Perspective: Global Help Matrix & Sovereign Telemetry Status](Artifacts/osint-scout-skill/osint-scout-skill_04_user_cli_help_status.jpg)

### Step 05 — Passive Attack Surface & DNS Reconnaissance (`osint-scout-skill scan`)
Running `osint-scout-skill scan nullai.tech` and `osint-scout-skill scan github.com` (`140.82.112.3`) to audit target A/AAAA records passively.

![Step 05 — User CLI Perspective: Passive Attack Surface & DNS Reconnaissance](Artifacts/osint-scout-skill/osint-scout-skill_05_user_cli_scan_domains.jpg)

### Step 06 — Autonomous Agent `SKILL.md` & Package Manifest
Inspecting `SKILL.md` (`name: domain-intel-scout`) and `package.json` for AI agent integration.

![Step 06 — User CLI Perspective: Autonomous Agent SKILL.md & Package Manifest](Artifacts/osint-scout-skill/osint-scout-skill_06_user_cli_skill_spec.jpg)

---

## Part III — Standalone Web Workstation GUI (`:8085`)

### Step 07 — Standalone Workstation: Passive DNS, SPF/DMARC Posture (`95%`) & CRT.SH Subdomains (`nullai.tech`)
Opening the Standalone Domain Intel OSINT Scout Workstation showing live DNS records (`75.2.60.5`, `99.83.231.61`), **Email Security & Spoofing Guard (`95% PROTECTED`)**, **Certificate Transparency Subdomain Discovery**, and 100% unlocked **Export Executive Security Dossier** / **Export Threat Graph JSON** actions.

![Step 07 — Standalone GUI: Passive DNS & SPF/DMARC Recon for nullai.tech](Artifacts/osint-scout-skill/osint-scout-skill_07_standalone_gui_nullai_recon.jpg)

### Step 08 — Standalone Workstation: `github.com` Attack Surface Audit
Switching the quick preset to `github.com` (`140.82.114.4`, `dns1..4.p08.nsone.net`, `ns-520.awsdns-01.net`) to inspect multi-provider NS records and SPF/DMARC quarantine policy enforcement.

![Step 08 — Standalone GUI: github.com Attack Surface Audit](Artifacts/osint-scout-skill/osint-scout-skill_08_standalone_gui_github_recon.jpg)

---

## Part IV — Zoth Studio v2 God-Mode Workbench (`:3000/tools/osint-scout-skill`) & Mobile Viewport

### Step 09 — Zoth Studio v2 God-Mode: Subdomain & Attack Surface Reconnaissance Console
Navigating to `http://127.0.0.1:3000/tools/osint-scout-skill` inside the unified Zoth Studio v2 application to inspect the **SubSweep / OSINT Scout Reconnaissance & Attack Surface Studio**.

![Step 09 — Zoth Studio v2 God-Mode: Subdomain & Attack Surface Recon Console](Artifacts/osint-scout-skill/osint-scout-skill_09_studio_gui_recon_console.jpg)

### Step 10 — Zoth Studio v2 God-Mode: Active DoH + Shodan InternetDB Enumeration (`35 Scanned / 12 Live`)
Executing the passive DoH enumeration pipeline (`EXECUTE RECON`) across 36 candidate hosts for `nullai.tech` and watching the live **Passive Recon Radar Telemetry** stream.

![Step 10 — Zoth Studio v2 God-Mode: Active DoH + Shodan InternetDB Enumeration](Artifacts/osint-scout-skill/osint-scout-skill_10_studio_gui_live_scan.jpg)

### Step 11 — Zoth Studio v2 God-Mode: Live Hosts Filter (`LIVE (12)`) & Resolved Perimeter Map
Switching to the **LIVE (12)** filter tab (`nullai.tech`, `www.nullai.tech`, `api.nullai.tech`, `cdn.nullai.tech`, `status.nullai.tech`) with 100% unlocked CSV, JSON, and Markdown Audit Brief exports.

![Step 11 — Zoth Studio v2 God-Mode: Live Hosts Filter & Resolved Perimeter Map](Artifacts/osint-scout-skill/osint-scout-skill_11_studio_gui_exposed_ports.jpg)

### Step 12 — Mobile 390×844 Responsive Verification
Verifying zero horizontal scroll overflow (`overflowPx === 0`), stacked responsive recon cards, and 44px touch targets at `390×844`.

![Step 12 — Mobile 390px Responsive Layout](Artifacts/osint-scout-skill/osint-scout-skill_12_mobile_390px_responsive.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/osint-scout-skill"]
        TUI["/usr/local/bin/osint-scout-skill-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8085<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/osint-scout-skill<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio osint-scout-skill.md"]
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
- **Unicode `U+2800` Braille TUI**: `osint-scout-skill-tui --status` / `osint-scout-skill-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
