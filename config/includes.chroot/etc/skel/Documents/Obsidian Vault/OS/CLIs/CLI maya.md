---
title: "maya"
tags: [os, cli, video, motion]
aliases: ["maya", "maya-linux"]
version: "2.0.0"
---

# maya

Launcher and headless 60 FPS procedural motion CLI for **Maya for Linux (Studio Pro `v2.0.0`)** installed at `/opt/maya-linux` and `/usr/local/bin/maya` (mirrored to `~/.local/bin/maya`).

## Usage & Flags

```bash
maya                                             # Launch Maya Studio Pro Electron desktop GUI
maya <video.mp4|mov|webm|mkv>                    # Open a video directly inside Maya Studio Pro
maya --version                                   # Print version (maya 2.0.0)
maya --status [--json]                           # Inspect installation, dist, and dependencies
maya --json                                      # Print structured JSON status (zero literal home paths)
maya --list-presets [--json]                     # List 6 headless 60fps procedural motion presets
maya --render <preset|all> [--out DIR] [--mirror DIR]
                                                 # Render 60fps MP4 via maya_motion_engine.py
```

## Components & Hardening

- **Desktop App (`/opt/maya-linux/main.js`, `preload.js`)**: Electron `v34.2.0` + React 19 / Vite 6 with `nodeIntegration: false`, `contextIsolation: true`, `webSecurity: true`, `sandbox: true`, strict CSP, `setWindowOpenHandler` / `will-navigate` guards, dialog-gated export paths, and zero external font CDN egress.
- **Headless Engine (`/opt/maya-linux/maya_motion_engine.py`)**: Self-contained clean-ISO 60 FPS procedural motion renderer with built-in font fitting, karaoke caption layout, NumPy background shaders, procedural audio synthesis, WAV mastering, and `tempfile.TemporaryDirectory()` cleanup.
- **Open Access**: 100% unlocked with zero paywalls. Engineered by **Neal Frazier Tech (`@1nc0gn30`) • NullAI Platform** ([nullai.tech](https://nullai.tech)).

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop maya-linux|Zoth Maya Video Studio]]
