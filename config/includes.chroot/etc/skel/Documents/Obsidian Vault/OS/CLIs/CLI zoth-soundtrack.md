---
title: "zoth-soundtrack"
tags: [os, cli]
aliases: ["zoth-soundtrack"]
---

# zoth-soundtrack

`file`: Bourne-Again shell script.

`zoth-soundtrack` launches the Zoth Hermetic Audio Studio player or falls back to an ambient background audio playlist.

## What it does

The script resolves audio playback via two modes:

1. **Electron GUI mode**: If `/opt/electron/electron` is executable, `/opt/zoth-music-app` exists, and a display environment (`DISPLAY` or `WAYLAND_DISPLAY`) is active, it delegates to `/usr/local/bin/electron /opt/zoth-music-app "$@"` with sandbox and GPU compatibility flags.
2. **Headless mpv fallback**: When running without an Electron environment, but `/usr/share/zothos/audio` exists and `mpv` is installed, it emits a desktop notification (`notify-send`) and starts background playback via `nohup mpv --no-video --loop-playlist=inf --shuffle /usr/share/zothos/audio`.

If neither runtime option is available, it prints an error message to `stderr` and exits with status 1.

## Paths and dependencies

- **App directory:** `/opt/zoth-music-app`
- **Audio directory:** `/usr/share/zothos/audio`
- **Runtimes:** `/usr/local/bin/electron`, `mpv`, `notify-send`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-soundtrack|zoth-soundtrack]]