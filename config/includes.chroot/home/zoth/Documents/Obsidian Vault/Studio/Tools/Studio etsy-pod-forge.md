---
title: "Etsy POD Forge"
tags: [studio, tool, verified, open-access, walkthrough-complete]
aliases: ["etsy-pod-forge", "Etsy POD Forge"]
pillar: "Pillar III: Autonomous Commerce & Storefront Engines"
category: "Commerce & POD"
runs: "server+browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-10-31"
test_status: "PASS (12-Step Gallery Verified)"
local_port: 8107
cli_binary: "etsy-pod-forge"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/etsy-pod-forge"
live_url: "http://127.0.0.1:8107"
studio_url: "http://127.0.0.1:3000/tools/etsy-pod-forge"
workstation_shot: "Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_07_gui_standalone_apparel_canvas.jpg"
studio_shot: "Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_11_gui_studio_godmode_forge.jpg"
cli_shot: "Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_04_cli_help_and_listing.jpg"
braille_shape: "lotus"
braille_archetype: "Sacred Lotus Botanical Mandala"
---

# Etsy POD Forge — Complete Developer & End-User Walkthrough

> [!CHECK] Sovereign Verification Passed (100% Free & Open-Access — 12-Step Real Screenshot Gallery)
> **Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform**
> Verified across Developer Architecture, `pytest` Unit Test Suite (`24 passed in 18.16s`), `/api/health` & `/api/cadres` REST API, Global ZothOS CLI (`--help`, `listing`, `generate`, `mockup`, `prompts`, `status`), Standalone Web Workstation (`http://127.0.0.1:8107`), Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/etsy-pod-forge`), and Mobile 390px Responsive Viewport (`overflowPx: 0`, `consoleErrors: 0`).

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `etsy-pod-forge` |
| **Category** | `Commerce & POD` |
| **Mathematical Pillar** | `Pillar III: Autonomous Commerce & Storefront Engines` |
| **Runtime Engine** | Python 3.12 HTTP/Canvas/Mockup Daemon + Interactive HTML5 Canvas Studio |
| **Local Port & URL** | `:8107` • [http://127.0.0.1:8107](http://127.0.0.1:8107) |
| **Studio God-Mode Route** | [http://127.0.0.1:3000/tools/etsy-pod-forge](http://127.0.0.1:3000/tools/etsy-pod-forge) |
| **CLI Binary** | `/usr/local/bin/etsy-pod-forge` • `~/.local/bin/etsy-pod-forge` • `./bin/etsy-pod-forge` |
| **GitHub Repository** | [https://github.com/1nc0gn30/etsy-pod-forge](https://github.com/1nc0gn30/etsy-pod-forge) |
| **Automated Test Suite** | `24 passed in 18.16s` (`pytest -v tests`) |
| **License & Pricing** | **100% Free & Open-Access** ($0) • Zero Paywalls |
| **Support Rails** | [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Part I — Developer Perspective (Architecture · Pytest Suite · REST API & Cadres)

### Step 1/12 — Repository Architecture, Package Modules & ZothOS Binaries
- **Command**: `ls -la && ls -la src/etsy_pod_forge && which -a etsy-pod-forge | uniq`
- **Verification**: Confirms the Python package layout (`canvas_generator.py`, `cli.py`, `listing_synthesizer.py`, `mockup_engine.py`, `prompt_vault.py`, `server.py`) and global CLI binaries in `/usr/local/bin/etsy-pod-forge` and `~/.local/bin/etsy-pod-forge`.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_01_dev_repo_architecture.jpg]]

### Step 2/12 — Automated Pytest Unit & Rendering Verification Suite (`24 passed`)
- **Command**: `PYTHONPATH=src pytest -v tests`
- **Verification**: Executes all 24 automated unit tests across `test_bind_host.py`, `test_forge.py` (`TestEtsyListingSynthesizer`, `TestCanvasGenerator`, `TestMockupEngine`, `TestPromptVault`, `TestServerAndApiEndpoints`), and `test_origin_guard.py` (`24 passed in 18.16s`).
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_02_dev_pytest_suite.jpg]]

### Step 3/12 — REST API `/api/health` Telemetry & `/api/cadres` 5-Cadre Specifications
- **Command**: `curl -s http://127.0.0.1:8107/api/health | python3 -m json.tool && curl -s http://127.0.0.1:8107/api/cadres | python3 -m json.tool | head -n 30`
- **Verification**: Confirms HTTP 200 OK JSON telemetry from `:8107/api/health` and inspects the 5 product cadres (`apparel`, `mugs`, `totes`, `wall_art`, `crafting`).
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_03_dev_api_health_and_cadres.jpg]]

---

## Part II — End-User CLI / Terminal Perspective (Global ZothOS Binary)

### Step 4/12 — ZothOS CLI Command Discovery (`--help`) & Etsy SEO Listing Synthesizer (`listing`)
- **Command**: `./bin/etsy-pod-forge --help && etsy-pod-forge listing --cadre apparel --title "Grandma's Garden" --names "Emma, Liam, Olivia, Noah"`
- **Verification**: Displays all 7 CLI subcommands (`generate, mockup, listing, prompts, serve, status, test`) and synthesizes a complete Etsy listing kit (`92 chars <= 140` title, 13 search tags `<= 20 chars` each, and `$18.72` Net Profit / `53.5% Margin`).
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_04_cli_help_and_listing.jpg]]

### Step 5/12 — CLI 300-DPI Canvas Generator (`generate`) & Lifestyle Mockup Compositor (`mockup`)
- **Command**: `etsy-pod-forge generate --cadre apparel --preview --title "GRANDMA'S GARDEN" --names "Emma, Liam, Olivia, Noah" --out /tmp/forge_apparel_canvas.png && etsy-pod-forge mockup --cadre apparel --color sand --out /tmp/forge_apparel_mockup.jpg && ls -lh /tmp/forge_apparel_*`
- **Verification**: Renders a transparent RGBA print canvas (`900x1080 px @ 300 DPI`) and composites a lifestyle garment mockup (`1600x1200 px`, `sand` colorway) directly to disk.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_05_cli_generate_and_mockup.jpg]]

### Step 6/12 — CLI AI Prompt Vault Catalog (`prompts`) & Live Daemon Telemetry (`status`)
- **Command**: `etsy-pod-forge prompts --cadre apparel --limit 4 && etsy-pod-forge status --port 8107`
- **Verification**: Lists curated Midjourney v6.1 & Flux.1 prompt recipes (`[apparel-01..04]`) and queries live daemon health on `:8107`.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_06_cli_prompt_vault.jpg]]

---

## Part III — End-User GUI Perspective (Standalone Workstation · Studio v2 God-Mode · Mobile)

### Step 7/12 — Standalone Web Workstation (`http://127.0.0.1:8107`) — Grandma's Garden Apparel Master Canvas
- **Surface**: `http://127.0.0.1:8107/` (`✦ Grandma's Garden Apparel` • `▣ Master Canvas`)
- **Verification**: Interactive Visual Canvas Studio rendering the `GRANDMA'S GARDEN` botanical family bouquet (`Emma, Liam, Olivia, Noah`) alongside the Live Profit Margin Engine (`$34.99` Retail, `$12.50` Production, `$3.77` Etsy Fees, `$18.72` Net Profit) and 13 High-Traffic Tags.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_07_gui_standalone_apparel_canvas.jpg]]

### Step 8/12 — Standalone Web Workstation (`http://127.0.0.1:8107`) — Lifestyle Mockup View & Tag Copy
- **Surface**: `http://127.0.0.1:8107/` (`✦ Lifestyle Mockup` • `Moss Green` Colorway)
- **Verification**: Switches to the Lifestyle Mockup view, selects the `Moss Green` garment swatch, and copies all 13 Etsy search tags to clipboard (`Copied all 13 Etsy Tags to clipboard!`).
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_08_gui_standalone_lifestyle_mockup.jpg]]

### Step 9/12 — Standalone Web Workstation (`http://127.0.0.1:8107`) — Songbirds & Floral Mugs Cadre
- **Surface**: `http://127.0.0.1:8107/` (`✦ Songbirds & Floral Mugs`)
- **Verification**: Switches to the `Cozy Songbirds & Animal Mugs` cadre, updating the canvas to `Morning Tea & Songbirds`, recalculating net margin (`$6.80` production -> `$24.42` net profit), and synthesizing 13 mug-specific search tags.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_09_gui_standalone_mugs_cadre.jpg]]

### Step 10/12 — Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/etsy-pod-forge`) — Etsy 13-Tag SEO & Shopify Transpiler
- **Surface**: `http://127.0.0.1:3000/tools/etsy-pod-forge` (`Tab 2: Etsy 13-Tag SEO & Shopify Transpiler`)
- **Verification**: Unified Studio God-Mode cockpit displaying the 13-tag SEO rank auditor (`100/100 ALGORITHMIC PEAK`) and Shopify GraphQL `productCreate` mutation generator.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_10_gui_studio_godmode_seo.jpg]]

### Step 11/12 — Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/etsy-pod-forge`) — 300-DPI Print & Mockup Forge
- **Surface**: `http://127.0.0.1:3000/tools/etsy-pod-forge` (`Tab 3: 300-DPI Print & Mockup Forge`)
- **Verification**: Interactive garment substrate selector (`Bella+Canvas 3001 Heavyweight Tee (4500×5400px @ 300 DPI)`) and procedural sacred geometry print preview with 1-click `.PNG` download.
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_11_gui_studio_godmode_forge.jpg]]

### Step 12/12 — Mobile Responsive Viewport (`390×844`) — Zero Horizontal Overflow Verification
- **Surface**: `http://127.0.0.1:8107/` at `390×844` mobile resolution
- **Verification**: Confirms responsive single-column layout, scrollable cadre strip, and `overflowPx: 0` (`scrollWidth <= clientWidth`).
![[Studio/Tools/Artifacts/etsy-pod-forge/etsy-pod-forge_12_gui_mobile_responsive.jpg]]

---

## Complete 12-Step Verification Matrix

| Step | Perspective | Surface / Stage | Exact Command or Route | Screenshot Artifact | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1/12** | **Developer** | Repo & Module Layout | `ls -la && ls -la src/etsy_pod_forge && which -a etsy-pod-forge` | `etsy-pod-forge_01_dev_repo_architecture.jpg` | 🟢 **PASS** |
| **Step 2/12** | **Developer** | Pytest Automated Suite | `PYTHONPATH=src pytest -v tests` (`24 passed in 18.16s`) | `etsy-pod-forge_02_dev_pytest_suite.jpg` | 🟢 **PASS** |
| **Step 3/12** | **Developer** | REST `/api/health` + Cadres | `curl -s :8107/api/health` & `curl -s :8107/api/cadres` | `etsy-pod-forge_03_dev_api_health_and_cadres.jpg` | 🟢 **PASS** |
| **Step 4/12** | **End-User CLI** | CLI Help & Listing Kit | `./bin/etsy-pod-forge --help` & `etsy-pod-forge listing ...` | `etsy-pod-forge_04_cli_help_and_listing.jpg` | 🟢 **PASS** |
| **Step 5/12** | **End-User CLI** | 300-DPI Canvas & Mockup | `etsy-pod-forge generate ...` & `etsy-pod-forge mockup ...` | `etsy-pod-forge_05_cli_generate_and_mockup.jpg` | 🟢 **PASS** |
| **Step 6/12** | **End-User CLI** | Prompt Vault & Status | `etsy-pod-forge prompts --cadre apparel` & `status --port 8107` | `etsy-pod-forge_06_cli_prompt_vault.jpg` | 🟢 **PASS** |
| **Step 7/12** | **End-User GUI** | Master Canvas (`:8107`) | `http://127.0.0.1:8107/` (`Grandma's Garden Apparel` Canvas) | `etsy-pod-forge_07_gui_standalone_apparel_canvas.jpg` | 🟢 **PASS** |
| **Step 8/12** | **End-User GUI** | Lifestyle Mockup (`:8107`) | `http://127.0.0.1:8107/` (`Lifestyle Mockup` + `Moss Green`) | `etsy-pod-forge_08_gui_standalone_lifestyle_mockup.jpg` | 🟢 **PASS** |
| **Step 9/12** | **End-User GUI** | Mugs Cadre (`:8107`) | `http://127.0.0.1:8107/` (`Songbirds & Floral Mugs`) | `etsy-pod-forge_09_gui_standalone_mugs_cadre.jpg` | 🟢 **PASS** |
| **Step 10/12** | **End-User GUI** | Studio SEO (`:3000`) | `http://127.0.0.1:3000/tools/etsy-pod-forge` (Tab 2: SEO & GraphQL) | `etsy-pod-forge_10_gui_studio_godmode_seo.jpg` | 🟢 **PASS** |
| **Step 11/12** | **End-User GUI** | Studio Forge (`:3000`) | `http://127.0.0.1:3000/tools/etsy-pod-forge` (Tab 3: 300-DPI Forge) | `etsy-pod-forge_11_gui_studio_godmode_forge.jpg` | 🟢 **PASS** |
| **Step 12/12** | **End-User GUI** | Mobile Viewport (`390×844`) | `http://127.0.0.1:8107/` (`overflowPx: 0`) | `etsy-pod-forge_12_gui_mobile_responsive.jpg` | 🟢 **PASS** |

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
