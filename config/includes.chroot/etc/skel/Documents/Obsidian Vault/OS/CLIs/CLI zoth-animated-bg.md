---
title: "zoth-animated-bg"
tags: [os, cli]
aliases: ["zoth-animated-bg"]
---

# zoth-animated-bg

`file`: Bourne-Again shell script.

`zoth-animated-bg` is the launcher script for the Cyber Film Strip and datamosh visualizer engine in ZothOS, located at `/usr/local/bin/zoth-animated-bg`.

## Purpose & Execution Flow

The script initializes and presents the animated desktop background:

1. **Directory Verification**: Confirms `/opt/zoth-live-wallpaper` exists, creating it if absent.
2. **Visualizer Launch**: If `/opt/zoth-live-wallpaper/index.html` is present:
   - Opens the interface via `xdg-open`.
   - Spawns a background browser process using Chromium (or Google Chrome) in kiosk mode with flags:
     ```bash
     --kiosk --disable-features=HardwareMediaKeyHandled --app="file://$ENGINE_HTML" --hide-crash-restore-button
     ```
3. **Fallback Provisioning**: If `index.html` is absent, prompts the user to execute `zoth-live-wallpaper` to provision the underlying visual FX assets.
4. **Interactive Handoff**: Concludes execution by launching an interactive `bash` subshell (`exec bash`).

## Core Paths

- **Script Location**: `/usr/local/bin/zoth-animated-bg`
- **Engine Directory**: `/opt/zoth-live-wallpaper`
- **Visualizer Entry**: `/opt/zoth-live-wallpaper/index.html`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-animated-bg|zoth-animated-bg]]