---
type: tool-intake
tool_id: robots-txt-auditor
name: Robots.txt & AEO Auditor
category: Growth & SEO
local_port: 8086
studio_url: http://127.0.0.1:3000/tools/robots-txt-auditor
standalone_url: http://127.0.0.1:8086
repo_path: ~/NullAITech/robots-txt-auditor
cli_binary: /usr/local/bin/robots-txt-auditor
status: VERIFIED_100_PERCENT_OPEN_ACCESS
step_screenshots: 12
verified_at: '2026-10-31'
tags:
- zoth-studio
- sovereign-arsenal
- step-by-step-walkthrough
- developer-guide
- user-guide
- robots-txt
- rfc-9309
- aeo
- seo
- ai-crawlers
- tool
---

# ⚡ Robots.txt & AEO Auditor (`robots-txt-auditor`) — Complete Developer & User Walkthrough

> **100% Free & Open-Access Sovereign Utility**: Zero paywalls, zero blur locks, zero telemetry. Support via [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## 🛠️ Part 1: Developer Perspective (Architecture, Pytest Suite & REST API Contracts)

### Step 1: Repository Architecture & Daemon Telemetry (`:8086`)
Developers inspecting `~/NullAITech/robots-txt-auditor` can verify the RFC 9309 Python server (`server.py`), the ZothOS CLI (`bin/robots-txt-auditor`), the standalone workstation (`public/index.html`), and the `pytest` suite (`tests/test_robots_txt_auditor.py`).

![Step 01 — Developer Repo & Daemon Status](Artifacts/robots-txt-auditor/robots-txt-auditor_01_dev_repo_architecture.jpg)

### Step 2: Automated Pytest Verification Suite (`8 passed in 1.78s`)
Running `pytest -v` executes 8 automated unit and integration tests covering RFC 9309 rule parsing, Frontier AI bot evaluations (`Googlebot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot`), `Crawl-delay` parsing, CLI preset audits, and HTTP REST API endpoints.

![Step 02 — Automated Pytest Verification](Artifacts/robots-txt-auditor/robots-txt-auditor_02_dev_pytest_suite.jpg)

### Step 3: Live HTTP REST API & RFC 9309 Audit Contracts (`:8086`)
Developers and autonomous agents can query `GET /health`, `GET /api/presets`, and `POST /api/audit` on port `8086` to programmatically evaluate `robots.txt` policies and compute AEO indexability scores (`100/100 A+`).

![Step 03 — Developer REST API & Audit Contracts](Artifacts/robots-txt-auditor/robots-txt-auditor_03_dev_api_contracts.jpg)

---

## 💻 Part 2: End-User CLI Perspective (ZothOS Global Binary & Frontier AI Audits)

### Step 4: Global ZothOS Binary Help Matrix, Presets & Status
Users can run `robots-txt-auditor --help`, `robots-txt-auditor --presets`, and `robots-txt-auditor --status` from any terminal directory to inspect available RFC 9309 presets and daemon telemetry.

![Step 04 — CLI Help Matrix & Presets](Artifacts/robots-txt-auditor/robots-txt-auditor_04_cli_help_presets.jpg)

### Step 5: Frontier AI Crawler Audit — Universal Access (`A+`) vs Air-Gapped Disallow (`F`)
Running `robots-txt-auditor --preset open_sovereign` verifies `100/100 (A+)` with all 5 Frontier AI bots allowed (`Googlebot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot`), whereas `robots-txt-auditor --preset stealth_disallow` reports `10/100 (F)` with all bots blocked by `Disallow: /`.

![Step 05 — CLI Universal Access vs Air-Gapped Audit](Artifacts/robots-txt-auditor/robots-txt-auditor_05_cli_audit_profiles.jpg)

### Step 6: Selective AI Quarantine Audit & Deterministic JSON AST Output
Running `robots-txt-auditor --preset selective_ai` and `robots-txt-auditor --audit selective_ai --json` audits directory-scoped quarantine rules (`/admin/`, `/api/private/`, `/internal/`) and emits machine-readable JSON telemetry.

![Step 06 — CLI Selective AI Quarantine & JSON Output](Artifacts/robots-txt-auditor/robots-txt-auditor_06_cli_selective_json.jpg)

---

## 🖥️ Part 3: End-User GUI Perspective (Standalone Workstation & Zoth Studio v2 God-Mode)

### Step 7: Standalone Workstation (`:8086`) — AI Welcoming Preset (`7/7 Bots Allowed · Score 100/100`)
Opening `http://127.0.0.1:8086` launches the standalone **AI Crawler & Robots.txt Studio** with line-numbered RFC 9309 editing, real-time path simulation (`/blog/autonomous-agents`), and the 7-bot compatibility matrix.

![Step 07 — Standalone GUI AI Welcoming Preset](Artifacts/robots-txt-auditor/robots-txt-auditor_07_gui_standalone_ai_welcome.jpg)

### Step 8: Standalone Workstation (`:8086`) — Strict Anti-Scraping Preset (Blocking AI Training Scrapers)
Selecting **Preset: Strict Anti-Scraping** updates the editor and immediately shows `GPTBot`, `ClaudeBot`, and `CCBot` marked as `✗ BLOCKED` with exact line-number citations while keeping `Googlebot` and `Bingbot` `✓ ALLOWED`.

![Step 08 — Standalone GUI Strict Anti-Scraping](Artifacts/robots-txt-auditor/robots-txt-auditor_08_gui_standalone_strict_block.jpg)

### Step 9: Standalone Workstation (`:8086`) — Modern SaaS Private Route Simulation (`/dashboard/billing`)
Selecting **Preset: Modern SaaS & Private API** and testing `/dashboard/billing` verifies that `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot`, `Bingbot`, and `CCBot` are blocked by `Disallow: /dashboard/` with Drift Shield verification active.

![Step 09 — Standalone GUI SaaS Path Simulation](Artifacts/robots-txt-auditor/robots-txt-auditor_09_gui_standalone_saas_path_sim.jpg)

### Step 10: Zoth Studio v2 God-Mode (`:3000/tools/robots-txt-auditor`) — Optimal AEO & SGE Workspace
Inside the Zoth Studio v2 enclave (`http://127.0.0.1:3000/tools/robots-txt-auditor`), users can insert directives with 1-click chips (`+ Allow: /`, `+ GPTBot Allow`, `+ Sitemap`), inspect the `100` AEO score gauge, and download `robots.txt`.

![Step 10 — Zoth Studio v2 God-Mode Optimal AEO](Artifacts/robots-txt-auditor/robots-txt-auditor_10_gui_studio_godmode_optimal.jpg)

### Step 11: Zoth Studio v2 God-Mode (`:3000/tools/robots-txt-auditor`) — SaaS & API Isolation Simulation (`/dashboard`)
Switching to **SaaS & API Isolation (/dashboard)** and clicking the `/dashboard` quick-test chip demonstrates real-time RFC 9309 longest-match precedence across all 7 crawlers.

![Step 11 — Zoth Studio v2 God-Mode SaaS Isolation](Artifacts/robots-txt-auditor/robots-txt-auditor_11_gui_studio_godmode_admin_block.jpg)

### Step 12: Mobile 390×844 Responsive Verification (`overflowPx === 0`)
Verified at mobile viewport (`390×844`) with zero horizontal scroll overflow (`overflowPx === 0`), clean mobile header, and full editor/simulator access.

![Step 12 — Mobile 390px Responsive Layout](Artifacts/robots-txt-auditor/robots-txt-auditor_12_mobile_390px_verified.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/robots-txt-auditor"]
        TUI["/usr/local/bin/robots-txt-auditor-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8086<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/robots-txt-auditor<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio robots-txt-auditor.md"]
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
- **Unicode `U+2800` Braille TUI**: `robots-txt-auditor-tui --status` / `robots-txt-auditor-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
