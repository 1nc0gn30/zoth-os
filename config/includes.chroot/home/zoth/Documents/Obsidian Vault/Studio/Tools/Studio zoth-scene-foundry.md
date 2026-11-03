---
title: "Zoth Scene Foundry — Complete Developer & End-User Walkthrough"
tool_id: "zoth-scene-foundry"
category: "Media & 3D"
local_port: 8823
studio_route: "http://127.0.0.1:3000/tools/zoth-scene-foundry"
cli_binary: "/usr/local/bin/zoth-scene-foundry"
repo_path: "/home/zoth/NullAITech/zoth-scene-foundry"
status: "VERIFIED_12_STEP_GALLERY"
updated: "2026-10-31"
---

# Zoth Scene Foundry (`zoth-scene-foundry`) — Complete Developer & End-User Walkthrough

> **100% Free & Open-Access Sovereign Tool** — Zero paywalls, zero blur locks, zero feature gates. Built by **1nc0gn30 • NullAI (`@1nc0gn30`) • NullAI Platform**. Support via [Stripe Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## Part 1: Developer Architecture & Verification Walkthrough

### Step 1: Repository Structure & Procedural Scene Engine Modules
Developers inspecting `/home/zoth/NullAITech/zoth-scene-foundry` can review the `src/` procedural shaders (`zoth-fields.js`, `zoth-ascii.js`, `zoth-pixel.js`, `zoth-three-ascii.js`, `zoth-three-soft.js`), the 1,000-scene catalog (`out/index.json`), and `server.py` on port `8823`.

![Step 1: Developer Repository Architecture](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_01_dev_repo_architecture.jpg)

### Step 2: Automated Pytest Verification Suite (`pytest -v`)
Running `pytest -v` in `/home/zoth/NullAITech/zoth-scene-foundry` verifies `/api/health`, `/api/status` (confirming `1,000` cataloged scenes and cathode tube palettes), and CLI `--synthesize` / `--tubes` subcommands (`2 passed in 1.09s`).

![Step 2: Developer Pytest Verification Suite](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_02_dev_pytest_suite.jpg)

### Step 3: REST API Contracts (`/api/status` & `/api/scenes`)
Querying `GET http://127.0.0.1:8823/api/status` and `GET http://127.0.0.1:8823/api/scenes` returns the 1,000-scene metadata (`ZS-0001` through `ZS-1000`), field signatures, ramps, and tube assignments.

![Step 3: Developer REST API Contracts](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_03_dev_api_mcp_contracts.jpg)

---

## Part 2: End-User ZothOS CLI & TUI Walkthrough

### Step 4: Global Binary Resolution & CLI Help (`zoth-scene-foundry --help`)
Users can verify `/usr/local/bin/zoth-scene-foundry` and `~/.local/bin/zoth-scene-foundry` via `which -a zoth-scene-foundry` and inspect all CLI flags (`--status`, `--scenes`, `--tubes`, `--synthesize SEED`, `--serve PORT`, `--json`).

![Step 4: End-User CLI Help & Installation](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_04_user_cli_help_install.jpg)

### Step 5: Daemon Telemetry, Cathode Tube Palettes & Scene Count (`--status`, `--tubes`, `--scenes`)
Running `zoth-scene-foundry --status --json`, `zoth-scene-foundry --tubes`, and `zoth-scene-foundry --scenes` outputs the live `:8823` daemon status, the 5 CRT phosphor palettes (`aurum_gold`, `retro_amber`, `cyber_cyan`, `sovereign_emerald`, `ghost_crimson`), and the 1,000-scene gallery count.

![Step 5: End-User CLI Status & Cathode Tubes](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_05_user_cli_workflow_a.jpg)

### Step 6: Deterministic Bayer 8×8 ASCII Matrix Synthesis (`--synthesize 42` & `--synthesize 777`)
Running `zoth-scene-foundry --synthesize 42` and `zoth-scene-foundry --synthesize 777` renders deterministic Unicode block-density (`░▒▓█`) ASCII matrices directly in the terminal.

![Step 6: End-User CLI Deterministic ASCII Synthesis](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_06_user_cli_workflow_b.jpg)

---

## Part 3: Standalone Web Workstation & Zoth Studio v2 God-Mode GUI

### Step 7: Standalone Web Workstation (`http://127.0.0.1:8823`) — Aurum Gold 60 FPS Stage
Opening `http://127.0.0.1:8823` launches the Live Procedural ASCII/Pixel Stage rendering Scene #042 (*Merkaba Vortex*) in the **Aurum Gold** cathode palette alongside the Foundry Seed Configuration editor.

![Step 7: Standalone Workstation Dark Mode Home](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_07_gui_standalone_dark_home.jpg)

### Step 8: Standalone Web Workstation — Cyber Cyan Tube & ASCII Synthesis
Selecting the **Cyan** (`CYBER CYAN`) cathode tube palette and clicking **Synthesize ASCII Scene ⚡** switches the real-time Bayer dither canvas to phosphor cyan and generates the corresponding ASCII block matrix.

![Step 8: Standalone Workstation Cyber Cyan & Synthesis](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_08_gui_standalone_interactive_a.jpg)

### Step 9: Standalone Web Workstation — Editorial Light Mode & Sovereign Emerald Tube
Toggling **Light Mode** (`☀ Light / Dark`) and selecting **Emerald** (`SOVEREIGN EMERALD`) renders the warm alabaster editorial interface paired with the high-contrast matrix emerald CRT stage.

![Step 9: Standalone Workstation Light Mode & Sovereign Emerald](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_09_gui_standalone_interactive_b.jpg)

### Step 10: Zoth Studio v2 God-Mode Route (`http://127.0.0.1:3000/tools/zoth-scene-foundry`)
Navigating to `/tools/zoth-scene-foundry` inside Zoth Studio v2 provides the unified God-Mode header, local `:8823` enclave badge, Web Mirror link, and CLI quick-copy bar.

![Step 10: Zoth Studio v2 God-Mode Overview](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_10_gui_studio_godmode_overview.jpg)

### Step 11: Zoth Studio v2 God-Mode — Interactive 4D Torus Knot & ASCII/Braille Synth
Scrolling into the Interactive Enclave Workstation inside Zoth Studio v2 showcases the live 4D Rotating Torus Knot ASCII/Braille synthesizer with SVG, 24-bit ANSI, and WebM export controls.

![Step 11: Zoth Studio v2 God-Mode Interactive Workstation](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_11_gui_studio_godmode_interactive.jpg)

### Step 12: Mobile Responsive Viewport (`390x844` — Zero Horizontal Overflow)
Verified on a `390x844` mobile viewport with `scrollWidth === 390` (`overflowPx === 0`), stacked Bento cards, responsive 60 FPS canvas, and touch-friendly tube palette chips.

![Step 12: Mobile 390px Responsive Verification](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-scene-foundry/zoth-scene-foundry_12_gui_mobile_390px.jpg)
