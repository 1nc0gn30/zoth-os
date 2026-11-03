---
title: "zoth-mode"
tags: [os, cli]
aliases: ["zoth-mode"]
---

# zoth-mode

`file`: Bourne-Again shell script.

`zoth-mode` is the environment and stealth mode switcher CLI (v3.0) for ZOTHOS, managing desktop profiles, wallpapers, sound cues, and network anonymity states.

## Desktop Profiles

- **`gold` / `default` / `sanctum`**: Sovereign Gold Master profile (default). Applies `zoth-gold-master.png`, plays `gold-sanctum.wav`, and disengages the `zoth-ghost` transparent proxy if active.
- **`ghost` / `stealth` / `amnesic`**: NullAI Ghostmode. Applies `ghostmode-nullai.png`, plays `ghost-vapor.wav`, and invokes `zoth-ghost start` for transparent Tor routing and MAC cloaking.
- **`matrix` / `hacker` / `green`**: Hermetic Matrix emerald profile. Applies `hermetic-matrix.png` and plays `matrix-chirp.wav`.
- **`incognito` / `win11` / `windows` / `undercover`**: Covert Chameleon guise. Applies `win11-bloom.jpg` and plays `win11-fluent.wav`.

## Commands & Modes

- `zoth-mode [profile]`: Directly switches to the designated profile.
- `zoth-mode toggle`: Toggles between `gold` and `ghost`.
- `zoth-mode status`: Returns the currently active profile name.
- Running without arguments launches an interactive selection prompt.

## State & Assets

- **State Files**: `~/.config/zothos/profile.state` and `~/.config/zothos/reality.state`
- **Wallpapers**: `/usr/share/backgrounds/zothos/`
- **Audio Cues**: `/usr/share/sounds/zothos/` (played via `paplay` or `aplay`)
- **Compositor Integration**: Applies backgrounds across KDE Plasma (CLI and DBus), XFCE4, and feh.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-mode|zoth-mode]]