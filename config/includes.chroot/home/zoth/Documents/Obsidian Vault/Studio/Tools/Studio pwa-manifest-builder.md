---
type: studio-tool
id: "pwa-manifest-builder"
title: "PWA Manifest Studio"
category: "Autonomous Web"
status: "verified"
repo: "pwa-manifest-builder"
localPort: 8100
localUrl: "http://127.0.0.1:8100"
studioUrl: "http://127.0.0.1:3000/tools/pwa-manifest-builder"
github: "https://github.com/1nc0gn30/pwa-manifest-builder"
liveUrl: "https://pwabuilder.nullai.tech"
version: "2.5.0"
pricing: "100% Free & Open-Access"
tags: [zoth-studio, sovereign-tool, autonomous-web, verified-gallery]
updated: "2026-10-31"
---

# PWA Manifest Studio (`pwa-manifest-builder`)

> **100% Free & Open-Access W3C Progressive Web App Manifest Architect, ServiceWorker Caching Compiler, Adaptive Maskable SVG Icon Forge, Lighthouse Installability Auditor, Web Share Target / File Handling Generator & PKZIP Bundle Exporter.**
> Engineered by **1nc0gn30 (@1nc0gn30)** • **NullAI Platform**

---

## 1. Executive Summary & Architectural Overview

**PWA Manifest Studio** (`pwa-manifest-builder`) is a zero-dependency Python 3.12+ and browser-native Progressive Web App engineering workstation:

1. **W3C Manifest Architect (`manifest_generator.py`)**: Synthesizes standards-compliant `manifest.webmanifest` payloads across 14 production presets (`ecommerce-store`, `saas-dashboard`, `ai-assistant`, `offline-notes`, `gaming-canvas`, etc.) alongside `<head>` Apple iOS & Microsoft Tile metadata.
2. **ServiceWorker Compiler (`serviceworker_generator.py`)**: Generates `sw.js` caching workers supporting `StaleWhileRevalidate`, `CacheFirst`, `NetworkFirst`, `NetworkOnly`, and `CacheOnly` strategies with Navigation Preload, Background Sync, and Web Push listeners.
3. **Advanced Web Capabilities (`shortcuts_simulator.py`, `share_and_file_handlers.py`)**: Validates and compiles App Shortcuts routers, `web+` URL Protocol Handlers, Web Share Target (`GET`/`POST` multipart) interceptors, and OS File Handling (`window.launchQueue`) scripts.
4. **Lighthouse Installability Auditor & ZIP Bundler (`linter.py`, `icon_forge.py`, `ui_server.py`)**: Scores manifests from `0–100`, generates `192×192`, `512×512`, and adaptive maskable icons, and exports a complete production `.zip` bundle.

---

## 2. Step-by-Step Visual Verification Gallery (12 Real Screenshots)

### Step 01 — Developer Perspective: Repository Architecture & Diagnostics Verification
Inspecting `/home/zoth/NullAITech/pwa-manifest-builder/src/pwa_manifest_builder/` (`catalog.py`, `cli.py`, `icon_forge.py`, `linter.py`, `manifest_generator.py`, `mcp_server.py`, `models.py`, `serviceworker_generator.py`, `share_and_file_handlers.py`, `shortcuts_simulator.py`, `ui_server.py`) and verifying `which -a pwa-manifest-builder` + `pwa-manifest-builder doctor --json`.

![01 Developer Repository Architecture](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_01_dev_repo_architecture.jpg)

---

### Step 02 — Developer Perspective: Automated Pytest Verification Suite (`101 passed`)
Running the full 101-test automated verification suite (`pytest tests/ -v`) covering template catalogs, CLI subcommands, SVG icon forge, Lighthouse linter, manifest generator, MCP JSON-RPC server, ServiceWorker compiler, Share Target/File Handlers, Shortcuts/Protocols, and the HTTP UI server.

![02 Automated Pytest Suite](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_02_dev_pytest_suite.jpg)

---

### Step 03 — Developer Perspective: Live HTTP REST API & Lighthouse Audit Contracts (`:8100`)
Verifying `GET /health`, `POST /api/generate-manifest`, and `POST /api/audit` on `http://127.0.0.1:8100`.

![03 Developer HTTP API Contracts](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_03_dev_api_contracts.jpg)

---

### Step 04 — End-User ZothOS CLI: 16-Subcommand Matrix & W3C Manifest Generator
Running `pwa-manifest-builder --help` to inspect all subcommands (`generate`, `sw`, `icons`, `audit`, `meta`, `templates`, `shortcuts`, `protocol`, `share-target`, `file-handlers`, `serve`, `mcp`, `doctor`, `test`) and synthesizing a W3C manifest via `pwa-manifest-builder generate --name "Sovereign Vault" ... --json`.

![04 CLI Help and Manifest Generator](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_04_cli_help_generate.jpg)

---

### Step 05 — End-User ZothOS CLI: ServiceWorker Compiler & Lighthouse Compliance Auditor
Generating a `StaleWhileRevalidate` ServiceWorker script via `pwa-manifest-builder sw --cache-name "vault-v1" --strategy stale-while-revalidate --stdout` and piping a template manifest into `pwa-manifest-builder audit - --json`.

![05 CLI ServiceWorker and Audit](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_05_cli_sw_audit.jpg)

---

### Step 06 — End-User ZothOS CLI: App Shortcuts Router & Web Share Target Validator
Running `pwa-manifest-builder shortcuts --template productivity --demo --json` and `pwa-manifest-builder share-target --template social --action "/share-inbox" --method POST --json`.

![06 CLI Shortcuts and Share Target](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_06_cli_shortcuts_share_files.jpg)

---

### Step 07 — End-User Standalone Web Workstation (`:8100`): Live Device Preview & 100/100 Lighthouse Gauge
Loading `http://127.0.0.1:8100` to inspect the 3-pane workstation featuring the **Basic Info / Display / Scope / ServiceWorker / Icon Forge / Capabilities** configurator, interactive **Install Bottom Sheet** mobile device simulator, **100 / 100** Lighthouse PWA Score gauge, and **9/9 Passed** PWA Audit Checklist.

![07 Standalone GUI Device Preview](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_07_gui_standalone_preview.jpg)

---

### Step 08 — End-User Standalone Web Workstation (`:8100`): ServiceWorker Configurator & `sw.js` Code Inspector
Switching to the **ServiceWorker** configuration tab (`pwa-cache-v1`, `Stale-While-Revalidate`, Background Sync, Web Push, Navigation Preload) and inspecting the live compiled `sw.js` script in **Code Inspector** mode.

![08 Standalone GUI ServiceWorker Code](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_08_gui_standalone_code_sw.jpg)

---

### Step 09 — End-User Standalone Web Workstation (`:8100`): Web Share Target & File Handling (`launchQueue`)
Switching to the **Capabilities** tab (`Web Share Target API` + `File Handling API launchQueue`) and inspecting the generated `share-receiver.js` client handler.

![09 Standalone GUI Capabilities](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_09_gui_standalone_capabilities.jpg)

---

### Step 10 — Zoth Studio v2 God-Mode (`:3000/tools/pwa-manifest-builder`): Archetype Selector & Device Simulator
Using the integrated God-Mode workstation at `http://127.0.0.1:3000/tools/pwa-manifest-builder` with 12 application archetypes, `W3C AUDIT: 100% PASSED (9/9)`, live mobile Install Modal simulator, and 1-click PKZIP bundle export.

![10 Zoth Studio God-Mode Simulator](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_10_gui_studio_godmode_simulator.jpg)

---

### Step 11 — Zoth Studio v2 God-Mode (`:3000/tools/pwa-manifest-builder`): Offline & SW Strategy + Code Compiler
Switching to `3. Offline & SW` and **Code** view on `:3000/tools/pwa-manifest-builder` to inspect the compiled `manifest.json` / `sw.js` / `<head> tags` / `offline.html` payloads.

![11 Zoth Studio God-Mode Code Compiler](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_11_gui_studio_godmode_code.jpg)

---

### Step 12 — Mobile 390×844 Viewport Responsive Verification (`overflowPx: 0`)
Verifying mobile layout responsiveness at `390×844` (`deviceScaleFactor: 2`) on `http://127.0.0.1:8100` with zero horizontal scroll overflow (`overflowPx === 0`) and 100% open-access controls.

![12 Mobile 390px Responsive Verification](file:///home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/pwa-manifest-builder/pwa-manifest-builder_12_mobile_390px_verified.jpg)

---

## 3. Support & Attribution

- **100% Free & Open-Access**: Zero paywalls, zero blur locks, and zero license keys required.
- **☕ Buy Us a Coffee (Stripe)**: [https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- **◎ Solana Tip Address**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`


---

## Sovereign 5-Layer Architecture & Second Brain Topology

```mermaid
flowchart LR
    subgraph L1["1. ZothOS v3.4 CLI & Braille TUI"]
        CLI["/usr/local/bin/pwa-manifest-builder"]
        TUI["/usr/local/bin/pwa-manifest-builder-tui<br/>(U+2800 2x4 Sub-Pixel Braille)"]
    end

    subgraph L2["2. Standalone Workstation"]
        WEB["http://127.0.0.1:8080<br/>REST API & /health"]
    end

    subgraph L3["3. Zoth Studio v2 & ZothOS-Lite"]
        STUDIO["http://127.0.0.1:3000/tools/pwa-manifest-builder<br/>God-Mode Component"]
        LITE["http://127.0.0.1:8145<br/>ZothOS-Lite Web Desktop"]
    end

    subgraph L4["4. Obsidian Second Brain & STDP Cortex"]
        TRACKER["http://127.0.0.1:8151<br/>Zoth Obsidian Tracker"]
        NEURO["http://127.0.0.1:8094<br/>Neuro-Memory STDP Cortex"]
        VAULT["Studio/Tools/Studio pwa-manifest-builder.md"]
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
- **Unicode `U+2800` Braille TUI**: `pwa-manifest-builder-tui --status` / `pwa-manifest-builder-tui --json`
- **Zoth Obsidian Tracker (`:8151`)**: `zoth-obsidian-tracker --verify`
- **Connected Canon Notes**: [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
