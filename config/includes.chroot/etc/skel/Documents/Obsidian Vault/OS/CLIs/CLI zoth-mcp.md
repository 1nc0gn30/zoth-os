---
title: "zoth-mcp"
tags: [os, cli]
aliases: ["zoth-mcp"]
---

# zoth-mcp

`file`: Bourne-Again shell script.

`zoth-mcp` is the master Model Context Protocol (MCP) Unified Bridge & Hub CLI for ZOTHOS, managing server registries, status diagnostics, daemon processes, and configuration syncing across AI clients.

> [!gold] Operator policy (2026-10-08)
> Catalog stays **off** until you name a server and run `zoth-mcp enable <name>`. Do not run `start-all` unless asked. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## Core Commands

- `list`: Displays a formatted table of registered MCP servers, security rings (`RING_0` through `RING_2`), offline modes, sandbox paths, and descriptions.
- `health`: Runs health and latency diagnostics on registered MCP endpoints.
- `start-all`: Spawns required offline MCP background daemons (such as HexStrike) and initializes local storage directories (`~/.hexstrike`, `~/.hermes`, `~/.zothos/data`).
- `stop-all`: Terminates running background MCP daemons and related processes.
- `sync`: Synchronizes servers from the master registry into client configurations for Grok, AGY, Claude Code, Hermes, Codex, OpenCode, Cursor, and Aider.
- `enable <name>` / `disable <name>`: Toggles server activation in the JSON registry and triggers sync.
- `test [server]`: Tests configuration, execution, and sandboxing for a specified server.
- `status`: Outputs operational status for all registered endpoints.
- `json`: Outputs the raw master registry JSON file.
- `interactive`: Launches an interactive terminal management menu.
- `gui` / `app`: Launches the Electron GUI at `/opt/zoth-mcp-app` if available, falling back to the interactive menu.

## Configuration Paths

- **User Registry**: `~/.config/zothos/mcp-servers.json`
- **System Registry**: `/etc/zothos/mcp-servers.json`
- **Runtime Directory**: `~/.zothos/mcp/run`
- **Log Directory**: `~/.zothos/mcp/logs`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-mcp|zoth-mcp]] · [[MCP Catalog]]