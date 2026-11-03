---
type: studio-tool
tool_id: "zoth-ascii-magic"
name: "Zoth ASCII Magic Studio"
category: "Media & 3D"
version: "2.7.0"
local_port: 8132
local_url: "http://127.0.0.1:8132"
studio_url: "http://127.0.0.1:3000/tools/zoth-ascii-magic"
github_url: "https://github.com/1nc0gn30/zoth-ascii-magic"
repo_path: "~/NullAITech/zoth-ascii-magic"
status: "verified"
access: "100% Free & Open Access"
stripe_coffee: "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
solana_tip: "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
updated: "2026-10-31"
tags: [zoth-studio, sovereign-tool, media-3d, zoth-ascii-magic, braille, bayer-dither, sobel-edges]
---

# Zoth ASCII Magic Studio (`zoth-ascii-magic`)

> **Avant-Garde Image, Video & 3D SDF to 24-Bit TrueColor ASCII, Sub-Pixel Unicode Braille & Bayer Dither Synthesizer** — Features 60fps procedural 3D SDF shaders (`cyberBust`, `liquidChrome`, `torus4d`, `merkaba`, `datamosh`, `radar`, `sigil`), 10 glyph quantizers (including 2×4 Unicode Braille `U+2800`, Atkinson, Floyd-Steinberg, Bayer 4×4/8×8 ordered dithering), Sobel directional edge contours (`/\|-`), interactive 2D point relighting, and scalable SVG/ANSI/HTML exports.
> **100% Free & Open-Access** • **Zero Paywalls** • [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Architecture & Operational Overview

1. **Developer Architecture (`~/NullAITech/zoth-ascii-magic`)**:
   - `bin/zoth-ascii-magic`: Core Python synthesis engine implementing `BAYER_4X4`, `BAYER_8X8`, `RAMPS`, `PALETTES`, `eval_sdf()`, Sobel horizontal/vertical gradient contour mapping (`gx`, `gy`), and `generate_svg()`.
   - `server.py`: Multi-threaded HTTP daemon on port `8132` serving `public/index.html` and REST endpoints `GET /health`, `GET /api/status`, and `GET /api/render`.
   - `tests/test_zoth_ascii_magic.py`: Automated `pytest` suite verifying Braille/Bayer8/SVG synthesis and HTTP render contracts.
2. **End-User ZothOS CLI (`zoth-ascii-magic`)**:
   - Installed at `~/.local/bin/zoth-ascii-magic` and `/usr/local/bin/zoth-ascii-magic`.
   - Supports `--preset`, `--mode`, `--tube`, `--cols`, `--no-edge`, `--no-color`, `--html`, `--svg`, `--json`, and `--status`.
3. **Interactive GUI Workstations**:
   - **Standalone Workstation (`http://127.0.0.1:8132`)**: 60fps interactive canvas with real-time 2D point-light dragging, 8 geometry presets, 6 CRT phosphor tube palettes, 10 dither/glyph quantizers, WebM video recording, and Dark/Light themes.
   - **Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/zoth-ascii-magic`)**: Integrated sovereign enclave workstation with live Braille/Bayer preview and one-click SVG/ANSI/HTML exports.

---

## Part I — Developer Perspective (Architecture, Automated Pytest Suite & API Contracts)

### Step 1: Repository Structure & Bayer/Braille Quantizer Matrices (`bin/zoth-ascii-magic`)
Inspecting `~/NullAITech/zoth-ascii-magic` directory structure and the `BAYER_4X4`, `BAYER_8X8`, `RAMPS`, and `PALETTES` definitions in `bin/zoth-ascii-magic`:

![Step 01 - Developer Architecture & Quantizer Matrices](Artifacts/zoth-ascii-magic/zoth-ascii-magic_01_dev_repo_architecture.jpg)

### Step 2: Running the Automated `pytest -v` Verification Suite
Executing `pytest -v` in `~/NullAITech/zoth-ascii-magic` to validate 3D SDF evaluation, Braille/Bayer8/SVG synthesis, and `/health` + `/api/render` HTTP endpoints (`2 passed in 0.54s`):

![Step 02 - Developer Automated Test Suite](Artifacts/zoth-ascii-magic/zoth-ascii-magic_02_dev_pytest_suite.jpg)

### Step 3: Verifying Live REST API & Procedural SDF Render Contract (`:8132`)
Querying `GET /health` and `GET /api/render?preset=torus4d&mode=braille&cols=42&no_color=1` on `http://127.0.0.1:8132`:

![Step 03 - Developer REST API & Procedural SDF Render Contract](Artifacts/zoth-ascii-magic/zoth-ascii-magic_03_dev_api_mcp_contracts.jpg)

---

## Part II — End-User CLI Perspective (Installation, Braille Contours & SVG Vector Export)

### Step 4: Global ZothOS Binary Discovery & CLI Help Contract
Running `which -a zoth-ascii-magic`, `zoth-ascii-magic --help`, and `zoth-ascii-magic --status` to confirm global CLI installation and active `:8132` daemon status:

![Step 04 - End-User ZothOS CLI Installation & Help Contract](Artifacts/zoth-ascii-magic/zoth-ascii-magic_04_user_cli_help_install.jpg)

### Step 5: CLI Workflow A — Sub-Pixel Unicode Braille & Sobel Directional Edge Synthesis
Rendering the 3D `cyberBust` SDF preset at 52 columns using the `braille` quantizer and directional Sobel edge contours (`/\|-`):

![Step 05 - End-User CLI Workflow A](Artifacts/zoth-ascii-magic/zoth-ascii-magic_05_user_cli_workflow_a.jpg)

### Step 6: CLI Workflow B — Bayer 8×8 Dither JSON Telemetry & Scalable SVG Vector Export
Synthesizing the `merkaba` SDF preset with `bayer8` ordered dithering (`--json`) and exporting scalable `<svg>` vector markup from the `liquidChrome` preset:

![Step 06 - End-User CLI Workflow B](Artifacts/zoth-ascii-magic/zoth-ascii-magic_06_user_cli_workflow_b.jpg)

---

## Part III — End-User GUI Perspective (Standalone Workstation, Studio God-Mode & Mobile)

### Step 7: Standalone Web Workstation (`:8132`) — Cyber Bust 3D & 2D Point Relighting Stage
Loading `http://127.0.0.1:8132` in Dark Mode, showcasing the 60fps **Cyber Bust 3D** stage with interactive 2D point-light reticle (`-0.35, -0.35`), Sovereign Gold phosphor palette, and 10 glyph quantizer controls:

![Step 07 - Standalone Dark Mode Cyber Bust 3D](Artifacts/zoth-ascii-magic/zoth-ascii-magic_07_gui_standalone_dark_home.jpg)

### Step 8: Standalone Interactive Workflow A — Liquid Chrome SDF + Unicode Braille + Cyber Cyan Tube
Switching to the **Liquid Chrome SDF** preset with **Unicode Braille** quantization, **Cyber Cyan** phosphor spectrum, and repositioning the 2D light source (`0.28, -0.22`):

![Step 08 - Standalone Interactive Liquid Chrome Braille](Artifacts/zoth-ascii-magic/zoth-ascii-magic_08_gui_standalone_interactive_a.jpg)

### Step 9: Standalone Interactive Workflow B — Editorial Light Mode + Sacred Merkaba + Bayer 8×8 Dither
Toggling Editorial Light Mode (`☀️ Light Mode`), selecting the **Sacred Merkaba** geometry preset with **Bayer 8×8 Dither** and **Sovereign Gold** phosphor, and inspecting the SVG/ANSI/HTML export controls:

![Step 09 - Standalone Light Mode Sacred Merkaba Bayer 8x8](Artifacts/zoth-ascii-magic/zoth-ascii-magic_09_gui_standalone_interactive_b.jpg)

### Step 10: Zoth Studio v2 God-Mode (`:3000/tools/zoth-ascii-magic`) — Overview & Local Enclave Bridge
Opening `http://127.0.0.1:3000/tools/zoth-ascii-magic` in Zoth Studio v2, verifying the Local Sovereign Node (`:8132`) status banner, Open-Access Stripe/Solana support badges, and CLI launch bar:

![Step 10 - Zoth Studio v2 God-Mode Overview](Artifacts/zoth-ascii-magic/zoth-ascii-magic_10_gui_studio_godmode_overview.jpg)

### Step 11: Zoth Studio v2 God-Mode — Interactive ASCII Magic & Braille Synth Enclave
Interacting with the embedded **Zoth ASCII Magic & Braille Synth** inside Zoth Studio v2 (`:3000/tools/zoth-ascii-magic`), testing 24-bit ANSI, SVG, and HTML/JS export actions:

![Step 11 - Zoth Studio v2 God-Mode Interactive Workstation](Artifacts/zoth-ascii-magic/zoth-ascii-magic_11_gui_studio_godmode_interactive.jpg)

### Step 12: Mobile 390×844 Responsive Viewport Verification (`overflowPx: 0`)
Verifying mobile layout responsiveness at `390×844` on `http://127.0.0.1:8132` with zero horizontal scroll overflow (`scrollWidth: 390, clientWidth: 390, overflowPx: 0`):

![Step 12 - Mobile 390px Responsive Verification](Artifacts/zoth-ascii-magic/zoth-ascii-magic_12_gui_mobile_390px.jpg)


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/zoth-ascii-magic"]
        TUI["/usr/local/bin/zoth-ascii-magic-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8132<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/zoth-ascii-magic<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio zoth-ascii-magic.md"]
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
- **Unicode `U+2800` Braille TUI**: `zoth-ascii-magic-tui --status` / `zoth-ascii-magic-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
