---
title: "zoth-ghost-gui"
tags: [os, cli]
aliases: ["zoth-ghost-gui"]
---

# zoth-ghost-gui

`file`: Bourne-Again shell script.

`zoth-ghost-gui` is a launcher script for ZothOS Ghostmode operations. It detects available graphical environments and launches either the dedicated Electron interface or falls back to a terminal session.

## Launch Behavior

When executed, the script inspects the running environment:

- **Electron GUI Mode**: If a graphical display (`$DISPLAY`) is detected, `electron` is installed, and `/opt/zoth-ghost-app/main.js` exists, it launches:
  ```bash
  exec electron --no-sandbox /opt/zoth-ghost-app "$@"
  ```
- **Konsole Fallback**: If `electron` or `/opt/zoth-ghost-app/main.js` is missing, it falls back to launching the interactive CLI tool:
  ```bash
  exec konsole -qwindowtitle 'Ghostmode Operations' -e /usr/local/bin/zoth-ghost
  ```

## Implementation Details

- **Path**: `/usr/local/bin/zoth-ghost-gui`
- **Runtime**: `/usr/bin/env bash` with strict error handling (`set -euo pipefail`)
- **Argument Forwarding**: Forwards any CLI flags or parameters (`"$@"`) to the Electron process

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-ghost|zoth-ghost]]