---
title: "zoth-mcp-gui"
tags: [os, cli]
aliases: ["zoth-mcp-gui"]
---

# zoth-mcp-gui

`file`: Bourne-Again shell script.

`zoth-mcp-gui` is the launcher for the ZOTH MCP Hub graphical interface.

## Operation

The script checks for GUI environment availability and chooses between an Electron window or a terminal fallback:

1. **Electron GUI Launch**:
   - Triggered when `$DISPLAY` is defined, `electron` is in `PATH`, and `/opt/zoth-mcp-app` exists.
   - Executes:
     ```bash
     exec electron --no-sandbox /opt/zoth-mcp-app "$@"
     ```

2. **Konsole Terminal Fallback**:
   - Fallback when graphical or Electron prerequisites are absent.
   - Launches the CLI hub within a KDE terminal window:
     ```bash
     exec konsole --title 'ZOTH MCP Hub' -e '/usr/local/bin/zoth-mcp'
     ```

## Paths

- **Launcher**: `/usr/local/bin/zoth-mcp-gui`
- **Application Directory**: `/opt/zoth-mcp-app`
- **CLI Target**: `/usr/local/bin/zoth-mcp`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-mcp|zoth-mcp]]