---
title: "zoth-studio"
tags: [os, cli]
aliases: ["zoth-studio"]
---

# zoth-studio

`file`: Python script.

`zoth-studio` is the native desktop application runtime and launcher for Zoth Studio Pro, orchestrating local HTTP asset serving and multi-tier GUI presentation.

## What it does

- **Directory discovery:** Detects the studio root by inspecting `$STUDIO_ROOT`, `~/NullAITech/zoth-studio-v2`, `/opt/zoth-studio`, or `/usr/share/zoth-studio`, prioritizing built assets in `dist/` or `public/`.
- **Local HTTP asset server:** Spawns a background Python `SimpleHTTPRequestHandler` on `127.0.0.1` across preferred ports (`8088`, `8080`, `3000`, `8008`, `8090`, `8099`, `8100–8149`, or an ephemeral port) with CORS headers enabled. Reuses any already running Zoth Studio instance.
- **Multi-tier GUI launcher:**
  1. *Electron standalone:* Launches via `/usr/local/bin/electron` or `/opt/electron/electron` with hardware acceleration and sandbox flags.
  2. *WebKit2GTK window:* Falls back to a native GTK 3.0 window (1440×960) embedding a WebKit2 WebView with WebGL and accelerated 2D canvas enabled.
  3. *Browser application mode:* Falls back to Chrome/Chromium (`--app=http://127.0.0.1:<port>`), Firefox (`--new-window`), or `xdg-open`.
- **Update flag:** Passing `--update`, `-u`, or `update` delegates execution directly to `zoth-update-studio`.
- **Process tracking:** Saves the active PID to `~/.zoth-studio/zoth-studio.pid`.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-studio|zoth-studio]]