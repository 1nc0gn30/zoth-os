---
title: "zoth-desktop-pet"
tags: [os, cli]
aliases: ["zoth-desktop-pet"]
---

# zoth-desktop-pet

`file`: Bourne-Again shell script.

`zoth-desktop-pet` launches the ZOTHOS Desktop Pet HUD & Mascot Companion v2.0, an Electron-based desktop avatar located at `/opt/zoth-desktop-pet`.

### Launch Requirements & Verification
- **Binary Resolution**: Searches standard system paths (`/usr/local/bin/electron`, `/usr/bin/electron`, `/opt/electron/electron`, or `$PATH`) to locate an executable Electron runtime.
- **Environment Checks**: Verifies that a valid graphical display is set (`DISPLAY` or `WAYLAND_DISPLAY`) and confirms the presence of `/opt/zoth-desktop-pet/main.js`.
- **Runtime Flags**: Executes the pet window with specific arguments enabling transparency and sandbox overrides:
  - `--no-sandbox`
  - `--disable-dev-shm-usage`
  - `--disable-gpu-sandbox`
  - `--enable-transparent-visuals`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-desktop-pet|zoth-desktop-pet]] · [[CLI zoth-cursor-daemon]]