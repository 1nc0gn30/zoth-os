---
title: "zoth-agent-hud"
tags: [os, cli]
aliases: ["zoth-agent-hud"]
---

# zoth-agent-hud

`file`: Python script.

`zoth-agent-hud` is the ZOTHOS Apex Agent & OS Controller HUD (v3.5 Ultra), providing an interactive command cockpit and telemetry interface.

## Architecture & Launch Sequence

When executed, the script attempts to launch the interface in stages:
1. **Electron Shell**: Inspects available Electron binaries (`/usr/local/bin/electron`, `/usr/bin/electron`, or `/opt/maya-linux/node_modules/.bin/electron`) pointing to `/opt/zoth-agent-app/main.js`.
2. **Tkinter Desktop Cockpit**: If Electron is absent, launches a native Tkinter dark-theme GUI cockpit (`AgentHUDApp`).

## Core Capabilities

- **Security Rings & Layer Selector**: Switches agent authority across layers 0 through 4 (Spectre, Runecrafter, Cyberpuppet, Warlock, Sovereign), persisting state to `~/.config/zothos/agent-layer.state`.
- **Live System Telemetry**: Polls `/usr/local/bin/zoth-sentinel status` every 2 seconds to report CPU usage, RAM utilization, IP/MAC network details, and Tor clearnet/stealth status.
- **Apex Arsenal Launcher**: Provides one-click launchers for system tools including Zoth Studio, HexStrike AI, Maya Linux, Hermes Agent, Tor Ghostmode, Live Wallpaper, Bitwarden Vault, and Obsidian Vault.
- **Sentinel AI Prompt Bar**: Interactive input bar dispatching prompts to `/usr/local/bin/zoth-sentinel ask` (or root `exec` if prefixed with `!`), logging responses to an embedded console.

## Configuration & Files

- **Script Location**: `/usr/local/bin/zoth-agent-hud`
- **User Layer State**: `~/.config/zothos/agent-layer.state`
- **Sentinel Configuration**: `/etc/zothos/sentinel.json`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-agent-hud|zoth-agent-hud]]