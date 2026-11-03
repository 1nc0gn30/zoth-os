---
title: "zoth-agent-os"
tags: [os, cli]
aliases: ["zoth-agent-os"]
---

# zoth-agent-os

`file`: Python script.

`zoth-agent-os` is the ZOTHOS Autonomous OS Agent Engine located at `/usr/local/bin/zoth-agent-os`. It functions as a hermetic, layer-gated, and security-ring-enforced operating system controller.

## Core Capabilities

- **Security Ring Enforcement**: Evaluates active permissions (Rings 0 through 3) against an internal action matrix prior to executing root actions, systemd modifications, file operations, or GUI actions.
- **Computer Use & Desktop Automation**: Implements OS automation helpers for mouse tracking, clicking, keyboard input, screenshot captures, and app execution.
- **Multi-Engine Routing**: Supports command orchestration across AI engines (Ollama, Hermes, Grok, Claude, Codex, OpenAI) to plan and fulfill system instructions.
- **Model Context Protocol (MCP) Server**: Exposes native OS tools, filesystem controls, and telemetry via a standard JSON-RPC stdio interface.

## CLI Subcommands

- `zoth-agent-os run <instruction>` — Executes an autonomous natural language instruction.
- `zoth-agent-os chat` — Opens an interactive terminal chat REPL supporting `/ring`, `/layer`, `/status`, `/hud`, and `/exit`.
- `zoth-agent-os status` — Emits current system telemetry, active ring, and policy settings as JSON.
- `zoth-agent-os mcp` — Initiates the stdio MCP server for agent integration.
- Direct invocation without subcommands interprets all arguments as a natural language instruction.

## Configuration & Audit

- **System Policy**: `/etc/zothos/agent-permissions.json` and `~/.config/zothos/agent-permissions.json`
- **State Tracking**: `~/.config/zothos/agent-ring.state` and `~/.config/zothos/agent-layer.state`
- **Agent Log**: `~/.local/share/zothos/agent.log`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[MCP zoth-agent-os|zoth-agent-os]]