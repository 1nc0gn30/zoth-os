---
title: "zoth-math-pillar"
tags: [os, cli]
aliases: ["zoth-math-pillar"]
---

# zoth-math-pillar

`file`: Bourne-Again shell script.

`zoth-math-pillar` launches the ZOTHOS Mathematical Pillar Telemetry Gauge HUD v1.0 Electron application.

## Operation

1. **Electron Detection**: Searches for an executable `electron` binary in `/usr/local/bin/electron`, `/usr/bin/electron`, `/opt/electron/electron`, and across system `PATH`. Exits with an error if no binary is found.
2. **Display Check**: Verifies that `$DISPLAY` or `$WAYLAND_DISPLAY` is present in the environment before launching.
3. **Application Verification**: Verifies the presence of the application entry point at `/opt/zoth-math-pillar/main.js`.
4. **Execution**: Launches the HUD application with the following Electron flags:
   - `--no-sandbox`
   - `--disable-dev-shm-usage`
   - `--disable-gpu-sandbox`
   - `--enable-transparent-visuals`
   - Passes any additional CLI arguments (`"$@"`) to the application.

## Paths

- **Launcher**: `/usr/local/bin/zoth-math-pillar`
- **Application Directory**: `/opt/zoth-math-pillar`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-math-pillar|zoth-math-pillar]]