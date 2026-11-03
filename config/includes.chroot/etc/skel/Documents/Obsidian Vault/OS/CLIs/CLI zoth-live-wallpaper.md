---
title: "zoth-live-wallpaper"
tags: [os, cli]
aliases: ["zoth-live-wallpaper"]
---

# zoth-live-wallpaper

`file`: Bourne-Again shell script.

`zoth-live-wallpaper` manages the ZothOS interactive live desktop wallpaper engine (v2.5), rendering dynamic sacred geometry, phosphor rain, and alchemical particle simulations.

## Commands

```bash
zoth-live-wallpaper [COMMAND] [mode] [theme]
```

- **`start [mode] [theme]`**: Launches the wallpaper engine (defaults to `matrix emerald`).
- **`stop`**: Terminates active wallpaper processes and reverts to the static background.
- **`restart`**: Cycles the wallpaper service off and back on.
- **`toggle`**: Toggles between live wallpaper animation and the static desktop background.
- **`status`**: Reports whether the background engine is active and shows its PID.
- **`preview`**: Opens the animation in a windowed browser session for previewing without setting it as root wallpaper.

## Visual Themes

- **`matrix`**: Emerald phosphor digital rain and Hermetic glyphs
- **`gold`**: Azoth golden sanctum with solar patterns
- **`void`**: Amnesic deep-blue cosmic geometry
- **`blood`**: Crimson flame and red alchemical streams
- **`neon`**: High-speed violet and cyan synthwave flux

## Architecture & Controls

- **Engine Asset**: `/usr/share/zothos/live-wallpaper/index.html`
- **Render Stack**: Leverages `xwinwrap` with a browser kiosk window (Chromium/Chrome/Brave/Firefox) for root desktop window projection.
- **Keyboard Controls**: Press `Space` to pause particles, `M` to cycle themes, `A` for audio drone, `C` for particle bursts, and `H` for the HUD.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-live-wallpaper|zoth-live-wallpaper]]