---
title: "zoth-desktop-hud"
tags: [os, cli]
aliases: ["zoth-desktop-hud"]
---

# zoth-desktop-hud

`file`: Bourne-Again shell script.

`zoth-desktop-hud` is the launcher script for the ZothOS Apex Telemetry HUD v5.0, an Electron-based desktop overlay providing real-time system metrics.

### Execution & Fallback Logic
- **Single-Instance Enforcement**: Uses `flock -n` on file descriptor 200 locking `/tmp/zoth-hud.lock` to prevent duplicate HUD processes from spawning.
- **Electron Discovery**: Attempts to execute the `/opt/zoth-hud` application directory using available Electron runtimes:
  - System binary: `electron --no-sandbox`
  - Node module path: `/usr/lib/node_modules/electron/dist/electron`
  - NPM runner: `npx electron --no-sandbox`
- **Fallback Execution**: If Electron is absent from the host, it attempts to execute the peer `zoth-os` binary located in the same directory, or exits with an error if no desk runtime is available.

## See also

[[Zoth OS]] · [[MOC CLIs]]