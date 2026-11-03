---
title: "zoth-ai"
tags: [os, cli]
aliases: ["zoth-ai"]
---

# zoth-ai

`file`: Bourne-Again shell script.

`zoth-ai` is the launcher for the ZOTH AI Stack Electron Cockpit and AI runtime environment, located at `/usr/local/bin/zoth-ai`.

## Execution Architecture

The script dynamically selects between a graphical desktop interface and a terminal fallback based on environment availability:

### 1. Graphical Electron Launch
- Evaluates candidate locations for the Electron runtime:
  - `/opt/electron/electron`
  - `/tmp/electron/electron`
  - System `PATH` (`which electron`)
- Verifies display variables (`$DISPLAY` or `$WAYLAND_DISPLAY`) and the existence of `/opt/zoth-ai-stack-app`.
- Launches the application with flags:
  ```bash
  exec "$ELECTRON_BIN" --no-sandbox --disable-gpu /opt/zoth-ai-stack-app "$@"
  ```

### 2. Headless Terminal Fallback
When run in headless mode or without graphical display servers, it outputs a status header and identifies available AI binaries on the system:
- Scans `PATH` for `hermes`, `grok`, `codex`, `claude`, `opencode`, `agy`, `ollama`, `aider`, `goose`, `fastmcp`, `zoth-mcp`, `garak`, and `pyrit`.

## File Locations

- **Script Path**: `/usr/local/bin/zoth-ai`
- **App Directory**: `/opt/zoth-ai-stack-app`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-ai|zoth-ai]]