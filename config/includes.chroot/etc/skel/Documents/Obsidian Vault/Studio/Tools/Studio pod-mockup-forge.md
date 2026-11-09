---
tool_id: pod-mockup-forge
name: POD Mockup Forge
category: Commerce & MCP
local_port: 8119
studio_route: http://127.0.0.1:3000/tools/pod-mockup-forge
standalone_url: http://127.0.0.1:8119
cli_binary: /usr/local/bin/pod-mockup-forge
repo_path: ~/NullAITech/pod-mockup-forge
test_status: PASS (12-Step Gallery Verified)
zero_paywalls: true
updated_at: '2026-10-31'
tags:
- tool
---

# POD Mockup Forge (`pod-mockup-forge`) — Full Developer & End-User Walkthrough

**POD Mockup Forge** is a photorealistic Print-on-Demand mockup compositor, print-zone aspect-fit calculator, 10-slot Etsy carousel blueprint planner, and Etsy 2026 seller photo compliance auditor for ZothOS and Zoth Studio v2.

---

## Part 1: Developer Perspective — Architecture, Unit Tests & REST API Contracts

### Step 1: Repository Architecture & Global CLI Binary Installation
Developers inspecting `~/NullAITech/pod-mockup-forge` can review the SVG/Canvas composite engine (`src/pod_mockup_forge/composite_engine.py`), Etsy 2026 photo auditor (`etsy_specs.py`), real image header probe (`image_probe.py`), 8 product scene templates (`templates.py`), and MCP server (`mcp_server.py`).

![Step 01 — Developer Repo & Architecture](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_01_dev_repo_and_install.jpg)

### Step 2: Automated Pytest Verification Suite (`23 passed`)
Running `pytest -v` executes 23 unit tests and 3 subtests validating SVG script-injection sanitization, bounding-box containment across all 8 templates, aspect-fit scaling math, Pillow image format probing, and Etsy 10-slot carousel blueprints.

![Step 02 — Developer Automated Pytest Suite](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_02_dev_pytest_suite.jpg)

### Step 3: Live HTTP REST API Contracts (`/health` & `POST /api/audit`)
Querying `GET /health` and posting image dimensions (`{"width_px": 2700, "height_px": 2025, "file_size_mb": 2.8}`) to `POST /api/audit` returns a `100/100` (`EXCELLENT`) Etsy 2026 photo compliance verdict (`4:3 Optimal`).

![Step 03 — Developer REST API Contracts](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_03_dev_api_contracts.jpg)

---

## Part 2: End-User CLI Perspective — Templates Registry, Aspect Fit, Photo Audit & Carousel Pack

### Step 4: Global ZothOS CLI Help & Templates Registry (`pod-mockup-forge list`)
Running `pod-mockup-forge --help` and `pod-mockup-forge list` displays all 7 subcommands (`list`, `render`, `fit`, `pack`, `audit`, `server`, `mcp`) and details the 8 mockup templates across Apparel, Drinkware, Wall Art, and Accessories.

![Step 04 — End-User CLI Help & Templates](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_04_user_cli_help.jpg)

### Step 5: CLI Print-Area Aspect Fit & Etsy Photo Compliance Audit
Executing `pod-mockup-forge fit --aw 4500 --ah 5400 --tw 810 --th 891` computes exact print-zone scaling (`742.5x891px`, `Scale: 0.165`) and `pod-mockup-forge audit --width 2700 --height 2025 --mb 2.4` verifies Etsy 2026 search readiness (`PASS 100/100`).

![Step 05 — End-User CLI Fit & Audit](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_05_user_cli_fit_and_audit.jpg)

### Step 6: CLI 10-Slot Etsy Listing Carousel Pack Planner (`pod-mockup-forge pack`)
Running `pod-mockup-forge pack` outputs the structured 10-slot Etsy listing carousel blueprint (`Slot #1: Primary Hero Image`, `Slot #2: Secondary Lifestyle Angle`, `Slot #3: Macro Texture`, `Slot #4: Sizing Chart`, `Slot #5: Color Swatches`, etc.) with conversion tips.

![Step 06 — End-User CLI 10-Slot Carousel Pack](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_06_user_cli_carousel_pack.jpg)

---

## Part 3: Standalone Web Workstation (`http://127.0.0.1:8119`)

### Step 7: Standalone Sovereign Workstation — Mockup Configuration & Live Composite Canvas
Opening `http://127.0.0.1:8119` presents the 8 scene templates, surface color variation swatches, PNG/SVG drag-and-drop uploader, and the Live Composite View rendering `Gildan 18000 Crewneck Sweatshirt` in Sand (`2000x2000px 300 DPI compliant`, `100/100 EXCELLENT`).

![Step 07 — Standalone Workstation Initial View](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_07_standalone_gui_initial.jpg)

### Step 8: Standalone Workstation — Switching Scene to Comfort Colors 1717 (4:3 Aspect) & Moss Swatch
Selecting `Comfort Colors 1717` (`Apparel • 4:3`) and clicking the `Moss` garment swatch updates the live canvas to `2700x2025px (300 DPI compliant) • Aspect: 4:3 (1.33:1)` with unwatermarked `Export 300 DPI Mockup`.

![Step 08 — Standalone Scene & Swatch Switch](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_08_standalone_gui_scene_switch.jpg)

### Step 9: Standalone Workstation — Unlocked Etsy 10-Slot Photo Carousel Master Blueprint
Scrolling down reveals the 100% unlocked `Etsy 10-Slot Photo Carousel Master Blueprint` (`SLOT 01` through `SLOT 10`) and the `Download Master Listing Pack (.ZIP)` action.

![Step 09 — Standalone 10-Slot Carousel Blueprint](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_09_standalone_gui_carousel_blueprint.jpg)

---

## Part 4: Zoth Studio v2 God-Mode Integration (`:3000`) & Responsive Verification

### Step 10: Zoth Studio v2 God-Mode — 300-DPI Print & Mockup Forge
Navigating to `http://127.0.0.1:3000/tools/pod-mockup-forge` opens Tab 3 (`3. 300-DPI Print & Mockup Forge`) of `PodCommerceGodModeTool.jsx`, featuring substrate selection (`Bella+Canvas 3001 Heavyweight Tee 4500x5400px`) and sacred motif generation.

![Step 10 — Studio v2 God-Mode Desktop](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_10_studio_gui_desktop.jpg)

### Step 11: Zoth Studio v2 God-Mode — Live Garment Silhouette & Print-Zone Preview
Scrolling down shows the full garment silhouette with the `24K Alchemical Merkaba + U+2800 Braille Ring` centered inside the dashed `ZOTH ATELIER 300-DPI` print bounding box and 1-click `.PNG` download.

![Step 11 — Studio v2 God-Mode Mockup Canvas](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_11_studio_gui_mockup_canvas.jpg)

### Step 12: Mobile 390×844 Responsive Layout Verification
At `390×844` mobile resolution, the 2-column template selector, color swatches, artwork dropzone, and Live Composite View stack vertically with zero horizontal overflow (`overflowPx === 0`).

![Step 12 — Mobile 390px Responsive View](~/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pod-mockup-forge/pod-mockup-forge_12_mobile_390px.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/pod-mockup-forge"]
        TUI["/usr/local/bin/pod-mockup-forge-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8119<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/pod-mockup-forge<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio pod-mockup-forge.md"]
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
- **Unicode `U+2800` Braille TUI**: `pod-mockup-forge-tui --status` / `pod-mockup-forge-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
