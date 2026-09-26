# ZOTHOS Engineering Backlog & Deferred Tasks

This document tracks items deferred or placed on hold during the ZothOS 1.0 refinement cycle.

## 1. Zoth Studio Application (COMPLETED & INTEGRATED)
- **Status**: Completed and fully integrated.
- **Current Behavior**: Zoth Studio v2 is deployed to `/opt/zoth-studio` with 71 pre-rendered static routes and verified `dist/` bundle.
- **One-Command Updater**: Deployed `zoth-update-studio` (also accessible via `zoth-studio --update` and `zoth-pkg update studio`).
- **Integration Checklist**:
  - [x] Pull verified release of Zoth Studio v2 from GitHub (`NullAITech/zoth-studio-v2.git`).
  - [x] Bundle dependencies cleanly into `/opt/zoth-studio` (`framer-motion`, Vite build pipeline).
  - [x] Validate IPC bridges and local hub endpoints (daemons on 8989, 8094, 8102, 8790, 8787).
  - [x] Create dedicated `zoth-update-studio` one-command updater with desktop notification and `--check`/`--rebuild` flags.

## 2. Desktop Launchers & Secondary App Polish
- [x] Standardized all terminal CLI tools (`matrix-rain`, `ghost-amnesic`, `powershell`, `netkill`, `undercover`, `cockpit`, `hexstrike`, `appimages`) to execute via `konsole` instead of running headless with `Terminal=false`.
- [x] Fixed `zoth-desk` Electron launch: passed `--no-open` to avoid unwanted browser popups and guarded telemetry against startup race conditions.
- [x] Fixed `tor-browser` resilient launcher wrapper and package installation.
- [x] Integrated `zoth-animated-bg` with ambient HTML5 gold Celtic matrix engine.
- [ ] Evaluate pruning secondary/niche desktop shortcuts to keep the main application menu ultra-clean.

## 3. Tool Nexus & System Runtimes
- [x] Added `browser-use`, `open-interpreter`, `goose`, `promptfoo`, and `inspect-ai` to curated tool catalog.
- [x] Added `rustc`, `go`, `clang`, `sqlite3`, and `foundryup` detection aliases to `zoth-pkg`.
- [x] Configured system-wide `/etc/environment` and `/etc/profile.d/zothos-env.sh` to include all binary directories (`~/.cargo/bin`, `~/.foundry/bin`, `go/bin`, `/opt/zothos-ai-env/bin`).
- [ ] Monitor disk footprint when pre-installing additional heavyweight LLM evaluation harnesses.

## 4. Visuals & Styling
- [x] Deployed clean Celtic "ZothOS" minimalist wallpaper (gold "Zoth" + platinum silver "OS" on obsidian dark matte canvas).
- [x] Configured KDE Plasma 6 Cyber Gold palette (`#FFD700` accents and glows on selections, buttons, and menus).
- [x] Enabled KWin mouse tracking and compositor effects.
