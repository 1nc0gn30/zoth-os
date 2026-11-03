---
type: studio-tool
tool_id: "zoth-bounty"
name: "Zoth Bounty Research Hub"
category: "Security & Enclave"
version: "1.0.0"
local_port: 9494
local_url: "http://127.0.0.1:9494"
studio_url: "http://127.0.0.1:3000/tools/zoth-bounty"
github_url: "https://github.com/1nc0gn30/zoth-bounty"
repo_path: "/home/zoth/NullAITech/zoth-bounty"
status: "verified"
access: "100% Free & Open Access"
stripe_coffee: "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
solana_tip: "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
updated: "2026-10-31"
tags: [zoth-studio, sovereign-tool, security-enclave, zoth-bounty, bug-bounty, responsible-disclosure]
---

# Zoth Bounty Research Hub (`zoth-bounty`)

> **Zero-False-Positive Security Research, Responsible Disclosure & Communications Command Center** — Tracks 24 security audits across `Pending (Disclosed)`, `Ongoing`, `Completed / Cleared`, and `Possible (Held Back by Skepticism Filter)` alongside Thunderbird/GHSA disclosure logs and a built-in Thermal Governor (`nice -n 19 ionice -c 3`, CPU `< 68°C`) static sink scanner.
> **100% Free & Open-Access** • **Zero Paywalls** • [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Architecture & Operational Overview

1. **Developer Architecture (`/home/zoth/NullAITech/zoth-bounty`)**:
   - `server.js`: Zero-dependency Node.js HTTP server on port `9494` managing `data/bounties.json`, `data/communications.json`, live CPU thermal polling (`getThermals()`), Thunderbird SQLite inbox sync (`getThunderbirdRecent()`), and `runCoolStaticScan()`.
   - `sync_docs.js`: Synchronizes JSON bounty findings and communications into structured Markdown reports under `docs/`.
   - `tests/test_zoth_bounty.py`: Automated `pytest` suite verifying bounty/communication data invariants and HTTP `/health`, `/api/status`, and `/api/state` endpoints.
2. **End-User ZothOS CLI (`zoth-bounty`)**:
   - Installed at `/home/zoth/.local/bin/zoth-bounty` and `/usr/local/bin/zoth-bounty`.
   - Supports `--help`, `--status`, `--list`, `--category {ongoing,pending,completed,possible}`, `--thermals`, `--json`, and `--serve PORT`.
3. **Interactive GUI Workstations**:
   - **Standalone Workstation (`http://127.0.0.1:9494`)**: Multi-category audit tracker (`Pending`, `Ongoing`, `Completed`, `Possible`, `Communications Log`), Cool-Mode Static Scanner (`nice -n 19`), and Dark/Light themes.
   - **Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/zoth-bounty`)**: Integrated sovereign security enclave with perimeter socket & CVE radar.

---

## Part I — Developer Perspective (Architecture, Automated Pytest Suite & API Contracts)

### Step 1: Repository Structure & Thermal Governor Sink Engine (`server.js`)
Inspecting `/home/zoth/NullAITech/zoth-bounty` directory layout, `data/bounties.json`, `data/communications.json`, and `getThermals()` in `server.js`:

![Step 01 - Developer Architecture & Thermal Governor](Artifacts/zoth-bounty/zoth-bounty_01_dev_repo_architecture.jpg)

### Step 2: Running the Automated `pytest -v` Verification Suite
Executing `pytest -v` in `/home/zoth/NullAITech/zoth-bounty` to verify bounty dataset invariants and `/health` + `/api/state` HTTP contracts (`2 passed in 0.20s`):

![Step 02 - Developer Automated Test Suite](Artifacts/zoth-bounty/zoth-bounty_02_dev_pytest_suite.jpg)

### Step 3: Verifying Live REST API & Bounty Telemetry Contracts (`:9494`)
Querying `GET /health` and `GET /api/status` on `http://127.0.0.1:9494`:

![Step 03 - Developer REST API & Bounty Telemetry Contract](Artifacts/zoth-bounty/zoth-bounty_03_dev_api_mcp_contracts.jpg)

---

## Part II — End-User CLI Perspective (Installation, Category Filtering & Thermal Telemetry)

### Step 4: Global ZothOS Binary Discovery & CLI Help Contract
Running `which -a zoth-bounty`, `zoth-bounty --help`, and `zoth-bounty --status` to confirm global CLI installation and active `:9494` daemon status:

![Step 04 - End-User ZothOS CLI Installation & Help Contract](Artifacts/zoth-bounty/zoth-bounty_04_user_cli_help_install.jpg)

### Step 5: CLI Workflow A — Filtering `Pending (Disclosed)` & `Ongoing` Findings + Thermal Check
Running `zoth-bounty --category pending`, `zoth-bounty --category ongoing`, and `zoth-bounty --thermals`:

![Step 05 - End-User CLI Workflow A](Artifacts/zoth-bounty/zoth-bounty_05_user_cli_workflow_a.jpg)

### Step 6: CLI Workflow B — Machine-Readable JSON Telemetry & Pending Findings Export
Executing `zoth-bounty --json` and `zoth-bounty --category pending --json` for automated security pipeline ingestion:

![Step 06 - End-User CLI Workflow B](Artifacts/zoth-bounty/zoth-bounty_06_user_cli_workflow_b.jpg)

---

## Part III — End-User GUI Perspective (Standalone Workstation, Studio God-Mode & Mobile)

### Step 7: Standalone Web Workstation (`:9494`) — Zero-False-Positive Security Research Dashboard
Loading `http://127.0.0.1:9494` in Dark Mode, displaying live CPU thermal telemetry, category summary cards (`4 Pending`, `1 Ongoing`, `18 Completed`, `1 Possible`, `6 Communications`), and detailed root-cause/triager-skepticism verification cards:

![Step 07 - Standalone Dark Mode Dashboard](Artifacts/zoth-bounty/zoth-bounty_07_gui_standalone_dark_home.jpg)

### Step 8: Standalone Interactive Workflow A — Filtering `Pending (Disclosed)` + Cool-Mode Static Audit
Filtering to **Pending (Disclosed)** findings (`ZB-2026-012` Mattermost Jira OAuth 2.0 callback) and executing a `nice -n 19` **Low-CPU Static Audit** on `agent-skills` (`[Repo: agent-skills | Hits: 4]`):

![Step 08 - Standalone Interactive Pending Filter & Static Audit](Artifacts/zoth-bounty/zoth-bounty_08_gui_standalone_interactive_a.jpg)

### Step 9: Standalone Interactive Workflow B — Editorial Light Mode & Responsible Disclosure Communications Log
Toggling Editorial Light Mode (`☀️ Light Mode`) and switching to the **Communications Log** tab to inspect outbound responsible disclosure emails (`COMM-2026-006`) and static scanner results:

![Step 09 - Standalone Light Mode Communications Log](Artifacts/zoth-bounty/zoth-bounty_09_gui_standalone_interactive_b.jpg)

### Step 10: Zoth Studio v2 God-Mode (`:3000/tools/zoth-bounty`) — Overview & Local Enclave Bridge
Opening `http://127.0.0.1:3000/tools/zoth-bounty` in Zoth Studio v2, verifying the Local Sovereign Node (`:9494`) status banner, Open-Access Stripe/Solana support badges, and CLI launch bar:

![Step 10 - Zoth Studio v2 God-Mode Overview](Artifacts/zoth-bounty/zoth-bounty_10_gui_studio_godmode_overview.jpg)

### Step 11: Zoth Studio v2 God-Mode — Interactive Perimeter Socket & CVE Radar Enclave
Interacting with the embedded security enclave workstation inside Zoth Studio v2 (`:3000/tools/zoth-bounty`):

![Step 11 - Zoth Studio v2 God-Mode Interactive Workstation](Artifacts/zoth-bounty/zoth-bounty_11_gui_studio_godmode_interactive.jpg)

### Step 12: Mobile 390×844 Responsive Viewport Verification (`overflowPx: 0`)
Verifying mobile layout responsiveness at `390×844` on `http://127.0.0.1:9494` with zero horizontal scroll overflow (`scrollWidth: 390, clientWidth: 390, overflowPx: 0`):

![Step 12 - Mobile 390px Responsive Verification](Artifacts/zoth-bounty/zoth-bounty_12_gui_mobile_390px.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/zoth-bounty"]
        TUI["/usr/local/bin/zoth-bounty-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:9494<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/zoth-bounty<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio zoth-bounty.md"]
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
- **Unicode `U+2800` Braille TUI**: `zoth-bounty-tui --status` / `zoth-bounty-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
