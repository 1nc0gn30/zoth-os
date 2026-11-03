---
type: studio-tool
tool_id: "pod-smart-router"
title: "POD Smart Router"
category: "Commerce & MCP"
local_port: 8117
studio_route: "http://127.0.0.1:3000/tools/pod-smart-router"
standalone_url: "http://127.0.0.1:8117"
cli_command: "pod-smart-router"
repo_path: "~/NullAITech/pod-smart-router"
status: "verified"
verification_level: "12-point-real-walkthrough"
screenshots_count: 12
updated: "2026-10-31"
tags:
  - sovereign-arsenal
  - studio-tool
  - commerce-and-mcp
  - printify
  - gelato
  - fulfillment-router
  - walkthrough-verified
---

# POD Smart Router — Complete Developer & User Walkthrough

> **Sovereign Arsenal Verification** • **Port**: `:8117` • **Studio Route**: `/tools/pod-smart-router` • **CLI**: `/usr/local/bin/pod-smart-router` • **100% Free & Open-Access**

**POD Smart Router** is a cross-channel fulfillment arbitrage engine that compares Printify Choice US/UK networks against Gelato's 32-country localized production mesh in real time. Given a SKU, destination country, quantity, Printify Premium account toggle, and routing strategy (`balanced`, `cheapest`, `fastest`, `customs_avoidance`, or `domestic_only`), it calculates exact landed costs, domestic hub availability, customs/VAT exposure, transit days, carbon miles saved, and emits ready-to-dispatch Printify Order API v1 or Gelato Order API v2 JSON payloads.

---

## Part 1 — Developer & Maintainer Walkthrough (Source, Tests & API Contracts)

### Step 1.1: Repository Layout & Local Editable Installation
Developers cloning `~/NullAITech/pod-smart-router` inspect the Python package (`src/pod_smart_router/core.py`, `cli.py`, `server.py`, `mcp_server.py`), the standalone Bento Cockpit UI (`public/index.html`, `public/app.js`, `public/style.css`), and the global ZothOS CLI symlink at `/usr/local/bin/pod-smart-router`.

![Step 1.1: Developer Repo Structure & CLI Symlink](Artifacts/pod-smart-router/pod-smart-router_01_dev_repo_and_install.jpg)

### Step 1.2: Running the Automated Pytest Verification Suite
Running `pytest -v` executes **9 comprehensive unit and integration tests** (`tests/test_router.py`) validating Printify Premium 20% discount calculations, US vs. EU/AU domestic hub selection, customs avoidance routing, multi-unit scaling, catalog matrix retrieval, and Printify v1 / Gelato v2 dispatch payload generation (`9 passed in 0.02s`).

![Step 1.2: Pytest Automated Suite](Artifacts/pod-smart-router/pod-smart-router_02_dev_pytest_suite.jpg)

### Step 1.3: REST API Health & Route Evaluation Contracts (`:8117`)
The HTTP daemon (`python3 -m pod_smart_router.server` on port `8117`) exposes `/health`, `/api/catalog`, `/api/matrix`, and `POST /api/route`, returning side-by-side Printify vs. Gelato landed cost evaluations and production API order payloads.

![Step 1.3: REST API Contracts](Artifacts/pod-smart-router/pod-smart-router_03_dev_api_contracts.jpg)

---

## Part 2 — End-User CLI & Terminal Workflow (`pod-smart-router`)

### Step 2.1: CLI Help & Global Command Flags
End users invoke `pod-smart-router --help` from any terminal to inspect all available flags (`--sku`, `--country`, `--quantity`, `--rule`, `--no-premium`, `--matrix`, `--dispatch`, `--catalog`, and `--json`).

![Step 2.1: CLI Help Interface](Artifacts/pod-smart-router/pod-smart-router_04_user_cli_help.jpg)

### Step 2.2: Comparing US Domestic vs. EU Customs-Avoidance Routing
Running `pod-smart-router --sku gildan_18000 --country US --rule balanced` selects **Printify** (`$14.99` vs. `$16.00`, saving `$1.01` via Printify Premium 20% discount), whereas routing `comfort_colors_1717` to Germany (`--country DE --rule customs_avoidance`) automatically pivots to **Gelato's** local EU hub (`$17.70` vs. `$22.03`, eliminating cross-border VAT/customs tariffs and saving 6 transit days).

![Step 2.2: US vs EU CLI Routing](Artifacts/pod-smart-router/pod-smart-router_05_user_cli_us_vs_eu_routing.jpg)

### Step 2.3: Global Country Matrix & Production Order Dispatch Payloads
Executing `pod-smart-router --sku bella_canvas_3001 --matrix` prints the multi-country routing matrix across `US`, `CA`, `GB`, `DE`, `FR`, `AU`, `JP`, and `BR`, while `--dispatch --json` outputs the exact JSON order payload ready for `POST` dispatch to Printify or Gelato.

![Step 2.3: Global Matrix & Dispatch Payload](Artifacts/pod-smart-router/pod-smart-router_06_user_cli_matrix_and_dispatch.jpg)

---

## Part 3 — End-User Standalone Web Workstation (`http://127.0.0.1:8117`)

### Step 3.1: Standalone Bento Cockpit — US Domestic Routing (`Printify Optimal`)
Opening `http://127.0.0.1:8117` launches the **POD Smart Router** workstation with interactive routing parameters on the left and the **Side-by-Side Landed Cost Matrix** on the right. For a `Gildan 18000 Heavy Blend Crewneck Sweatshirt` shipping to the United States with Printify Premium enabled, **Printify** wins the `⭐ OPTIMAL ROUTE` badge at `$14.99` total landed cost (`$1.01` margin advantage over Gelato's `$16.00`).

![Step 3.1: Standalone GUI US Domestic Route](Artifacts/pod-smart-router/pod-smart-router_07_standalone_gui_initial.jpg)

### Step 3.2: Interactive EU Routing Pivot (`France Gelato Domestic Hub`)
Switching the **Customer Destination Country** to `France (Gelato Domestic Hub)` and **Optimization Strategy** to `Zero Customs Tariff Guarantee` dynamically pivots the `⭐ OPTIMAL ROUTE` badge to **Gelato** (`$16.00` domestic vs. Printify's `$27.00` cross-border landed cost), delivering an **`$11.00` Margin Advantage**, **`9 Days` Transit Accelerated**, and **`4,100 Miles` Carbon Miles Saved**.

![Step 3.2: Standalone GUI France Gelato Hub](Artifacts/pod-smart-router/pod-smart-router_08_standalone_gui_eu_routing.jpg)

### Step 3.3: 100% Unlocked Production API Dispatch Payload & FAQ
Scrolling down displays the live **Production API Dispatch Payload** (`https://api.gelato.com/v2/orders`) with one-click `Copy Payload` and `Download JSON` actions completely unlocked (zero paywalls or blur filters), followed by the structured FAQ knowledge base.

![Step 3.3: Production API Dispatch Payload](Artifacts/pod-smart-router/pod-smart-router_09_standalone_gui_dispatch_payload.jpg)

---

## Part 4 — Zoth Studio v2 God-Mode Workstation (`:3000/tools/pod-smart-router`) & Mobile Verification

### Step 4.1: Zoth Studio v2 God-Mode Integration (`:3000/tools/pod-smart-router`)
Inside Zoth Studio v2 (`http://127.0.0.1:3000/tools/pod-smart-router`), the `EcommerceSuiteGodModeTool` renders the **POD Smart Router — Margin, SEO & 300-DPI Asset Forge** enclave with live net margin telemetry (`46.9% / $14.06`), 60fps CRT scanline visualization, and non-intrusive `Buy Us a Coffee` / `Solana Tip` support buttons.

![Step 4.1: Zoth Studio v2 Desktop View](Artifacts/pod-smart-router/pod-smart-router_10_studio_gui_desktop.jpg)

### Step 4.2: Studio Multi-Hub Arbitrage Matrix & Signed Dispatch Export
Scrolling into the interactive workspace reveals sliders for Unit Retail Price, Buyer Shipping, and Order Quantity alongside the 3-way comparison between **Printify Choice US/UK Network**, **Gelato Local Hub (32-Country Mesh)**, and **Sovereign Direct Fine-Art Atelier**, plus the signed JSON dispatch exporter.

![Step 4.2: Zoth Studio v2 Fulfillment Matrix](Artifacts/pod-smart-router/pod-smart-router_11_studio_gui_fulfillment_matrix.jpg)

### Step 4.3: Mobile 390×844 Responsive Layout Verification
Verified at `390×844` mobile viewport (`overflowPx === 0`): the Routing Parameters form and Side-by-Side Landed Cost Matrix stack cleanly in a single column with full-width select controls and touch-friendly toggles.

![Step 4.3: Mobile 390px Verification](Artifacts/pod-smart-router/pod-smart-router_12_mobile_390px.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/pod-smart-router"]
        TUI["/usr/local/bin/pod-smart-router-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8117<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/pod-smart-router<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio pod-smart-router.md"]
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
- **Unicode `U+2800` Braille TUI**: `pod-smart-router-tui --status` / `pod-smart-router-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
