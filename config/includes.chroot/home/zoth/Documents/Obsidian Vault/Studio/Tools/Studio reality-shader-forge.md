---
type: tool-intake
tool_id: "reality-shader-forge"
name: "Zoth Reality Shader & Theme Forge"
category: "Media & 3D"
local_port: 8134
studio_url: "http://127.0.0.1:3000/tools/reality-shader-forge"
standalone_url: "http://127.0.0.1:8134"
repo_path: "/home/zoth/NullAITech/reality-shader-forge"
cli_binary: "/usr/local/bin/reality-shader-forge"
status: "VERIFIED_100_PERCENT_OPEN_ACCESS"
step_screenshots: 12
verified_at: "2026-10-31"
tags: [zoth-studio, sovereign-arsenal, step-by-step-walkthrough, developer-guide, user-guide, media-3d, kde-plasma, alacritty, css-tokens]
---

# 🌌 Zoth Reality Shader & Theme Forge (`reality-shader-forge`) — Complete Developer & User Walkthrough

> **100% Free & Open-Access Sovereign Utility**: Zero paywalls, zero blur locks, zero telemetry. Support via [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## 🛠️ Part 1: Developer Perspective (Architecture, Automated Tests & API Verification)

### Step 1: Repository Architecture & Source Tree Inspection
Developers cloning or inspecting `/home/zoth/NullAITech/reality-shader-forge` can verify the standalone HTTP server (`server.py`), the ZothOS CLI binary (`bin/reality-shader-forge`), the interactive 60fps Canvas & theme compiler UI (`public/index.html`), and the 24-test `pytest` verification suite (`tests/test_reality_shader_forge.py`).

![Step 01 — Developer Repo & Source Tree](Artifacts/reality-shader-forge/reality-shader-forge_01_dev_repo_architecture.jpg)

### Step 2: Automated Pytest Verification Suite (`24 passed in 0.76s`)
Running `pytest -v` executes 24 automated unit and integration tests covering all 5 Zoth Realities (`gold`, `cyan`, `crimson`, `emerald`, `purple`) across all 4 export formats (`kde`, `alacritty`, `css`, `json`), CLI flag execution, and live HTTP server endpoints (`/health`, `/api/status`, `/api/realities`, `/api/compile`).

![Step 02 — Automated Pytest Verification](Artifacts/reality-shader-forge/reality-shader-forge_02_dev_pytest_suite.jpg)

### Step 3: Live REST API & Multi-Reality Compiler Contract Verification
Developers and autonomous agents can query `/health`, `/api/realities`, and `/api/compile?reality=emerald&format=kde` on port `8134` to programmatically list the 5 Zoth Realities and synthesize KDE Plasma `.colors`, Alacritty `.toml`, or CSS custom property payloads.

![Step 03 — Developer API & Compiler Contract](Artifacts/reality-shader-forge/reality-shader-forge_03_dev_api_contracts.jpg)

---

## 💻 Part 2: End-User CLI Perspective (ZothOS Global Binary & Multi-Format Export)

### Step 4: Global ZothOS Binary Discovery & CLI Help Matrix
End-users on ZothOS can run `reality-shader-forge --help` and `reality-shader-forge --list` from any terminal directory to view all 5 Zoth Realities (`gold`, `emerald`, `cyan`, `crimson`, `purple`), companion Zoth Bot avatars, and output formats.

![Step 04 — User CLI Help & Reality Matrix](Artifacts/reality-shader-forge/reality-shader-forge_04_cli_help_list.jpg)

### Step 5: Compiling KDE Plasma 6 `.colors` & Alacritty `.toml` via CLI
Running `reality-shader-forge --reality gold --format kde` and `reality-shader-forge --reality cyan --format alacritty` outputs a complete, spec-compliant KDE Plasma 6 color scheme (`ZothAurumGold.colors`) and Alacritty GPU terminal configuration (`#00F0FF` Cyber Cyan).

![Step 05 — User CLI KDE Plasma .colors & Alacritty .toml Output](Artifacts/reality-shader-forge/reality-shader-forge_05_cli_kde_alacritty.jpg)

### Step 6: Compiling CSS `:root` Design Tokens & ZothOS v3 JSON Descriptors
Running `reality-shader-forge --reality crimson --format css` and `reality-shader-forge --reality purple --format json` generates `:root[data-zoth-reality="crimson"]` CSS tokens (`#F43F5E` Ghost Crimson) and the full ZothOS v3 JSON reality descriptor (`#A855F7` Void Obsidian).

![Step 06 — User CLI CSS Tokens & JSON Descriptor Export](Artifacts/reality-shader-forge/reality-shader-forge_06_cli_css_json.jpg)

---

## 🖥️ Part 3: End-User GUI Perspective (Standalone Workstation & Zoth Studio v2 God-Mode)

### Step 7: Standalone Workstation (`:8134`) — Aurum Gold (`AURELIUS-9`) & KDE `.colors`
Opening `http://127.0.0.1:8134` launches the standalone workstation featuring the live 60fps sacred geometry constellation canvas, the 5-Reality selector bar, physics sliders (`Particle Velocity`, `Constellation Nodes`, `Chrome Radius`), and the live KDE Plasma `.colors` synthesizer.

![Step 07 — Standalone GUI Aurum Gold & KDE Colors](Artifacts/reality-shader-forge/reality-shader-forge_07_gui_standalone_aurum.jpg)

### Step 8: Standalone Workstation (`:8134`) — Sovereign Emerald & Alacritty `.toml`
Selecting **Sovereign Emerald** switches the live 60fps WebGL/Canvas shader to `#10B981` and `#34D399` and compiles the corresponding Alacritty `.toml` terminal configuration.

![Step 08 — Standalone GUI Sovereign Emerald & Alacritty TOML](Artifacts/reality-shader-forge/reality-shader-forge_08_gui_standalone_emerald_alacritty.jpg)

### Step 9: Standalone Workstation (`:8134`) — Cyber Cyan & Studio `.css`
Selecting **Cyber Cyan** (`#00F0FF` / `#38BDF8`) and switching to the **Studio Reality (.css)** tab synthesizes the `:root[data-zoth-reality="cyan"]` CSS custom properties with 1-click copy and `.css` file download.

![Step 09 — Standalone GUI Cyber Cyan & CSS Tokens](Artifacts/reality-shader-forge/reality-shader-forge_09_gui_standalone_cyan_css.jpg)

### Step 10: Zoth Studio v2 God-Mode (`:3000/tools/reality-shader-forge`) — Interactive Reality & Zoth Bot Canvas
Inside the Zoth Studio v2 enclave (`http://127.0.0.1:3000/tools/reality-shader-forge`), users can switch between all 5 global studio realities in real time, preview the animated Zoth Bot character HUD overlay, and adjust shader velocity and node density.

![Step 10 — Zoth Studio v2 God-Mode Shader Canvas](Artifacts/reality-shader-forge/reality-shader-forge_10_gui_studio_godmode_shader.jpg)

### Step 11: Zoth Studio v2 God-Mode (`:3000/tools/reality-shader-forge`) — Theme Artifact Compiler
Switching tabs in the God-Mode compiler panel exports ready-to-use KDE Plasma `.colors`, Alacritty `.toml`, and Studio `.css` artifacts synchronized with the active Zoth Studio reality.

![Step 11 — Zoth Studio v2 God-Mode Theme Compiler](Artifacts/reality-shader-forge/reality-shader-forge_11_gui_studio_godmode_compiler.jpg)

### Step 12: Mobile 390×844 Responsive Verification (`overflowPx === 0`)
Verified at mobile viewport (`390×844`) with zero horizontal scroll overflow (`overflowPx === 0`), stacked reality selector pills, touch-friendly physics sliders, and full mobile code export access.

![Step 12 — Mobile 390px Responsive Layout](Artifacts/reality-shader-forge/reality-shader-forge_12_mobile_390px_verified.jpg)
