---
title: "zoth-crt-overlay"
tags: [os, cli]
aliases: ["zoth-crt-overlay"]
---

# zoth-crt-overlay

`file`: Bourne-Again shell script.

`zoth-crt-overlay` is a bash daemon that injects a full-screen horizontal scanline overlay across the display to produce an authentic CRT phosphor aesthetic. It is intended to run before `picom` for seamless window compositing.

### Capabilities & Behavior
- **Asset Generation**: If the scanline image (`/usr/share/backgrounds/zothos/crt-scanlines.png`) is missing, it dynamically generates a 1920×1080 transparent PNG with dark horizontal stripes (2px stripe height, alpha 28) using Python PIL.
- **Overlay Window**: Launches a borderless, click-through, topmost Tkinter window (`-fullscreen`, `-topmost`, `-disabled`, `-transparentcolor black`) displaying the scanline overlay canvas.
- **Process Management**: Tracks the background process ID inside `/run/zoth-crt-overlay/pid`.

### Commands
- `zoth-crt-overlay start` — Generates missing assets and spawns the full-screen overlay daemon.
- `zoth-crt-overlay stop` — Terminates the active overlay and cleans up the PID file.
- `zoth-crt-overlay toggle` — Alternates the overlay state between running and stopped.
- `zoth-crt-overlay status` — Checks if the PID is active and returns exit code `0` (active) or `1` (inactive).

## See also

[[Zoth OS]] · [[MOC CLIs]]