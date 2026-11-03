---
title: "zoth-cursor-daemon"
tags: [os, cli]
aliases: ["zoth-cursor-daemon"]
---

# zoth-cursor-daemon

`file`: JavaScript source.

`zoth-cursor-daemon` is a Python 3 background daemon providing real-time (~60 FPS / 16ms interval) global cursor tracking across KDE Plasma 6 Wayland and X11 sessions.

### Architecture & Operation
- **KWin DBus Scripting**: Under KDE Plasma, it dynamically injects a KWin script (`zoth_cursor_tracker` via `qdbus org.kde.KWin /Scripting`) that polls `workspace.cursorPos` every 16ms and notifies a local DBus service (`org.zothos.CursorService /Cursor`). A 5-second watchdog timer continuously verifies and re-registers the script if unloaded.
- **Fallback Tracking**: When KWin DBus is unavailable, it falls back to polling cursor coordinates via Tkinter (`winfo_pointerxy()`) every 16ms.

### Broadcast Channels
- **Shared Memory**: Writes atomic JSON payloads (`{"x":..., "y":..., "timestamp":...}`) to RAM at `/dev/shm/zoth_cursor.json` and mirrors to `/tmp/zoth_cursor.json`.
- **UDP Datagrams**: Broadcasts `x,y` coordinate pairs over UDP socket to `127.0.0.1:9988` for low-latency desktop listeners such as the Pet HUD and Sentinel HUD.
- **HTTP Endpoint**: Serves the latest cursor coordinates over a local HTTP server on `127.0.0.1:9989` with CORS enabled (`Access-Control-Allow-Origin: *`).

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-desktop-pet|zoth-desktop-pet]]