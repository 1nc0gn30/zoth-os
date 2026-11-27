---
title: "Hermes Agent CLI"
tags: [agent, sovereign-fleet, hermes, cli]
aliases: ["Hermes Agent", "Hermes CLI"]
role: "Multi-Interface Tool-Calling AI Agent & Terminal Cockpit"
runtime: "NousResearch Hermes / Python / Electron"
port: "ephemeral-loopback (discovered via hermes-gateway port --json)"
socket: "~/.hermes/gateway.sock"
systemd_unit: "hermes-gateway.service"
status: "active"
stdp_enabled: true
---

# Hermes Agent CLI

Autonomous tool-calling AI agent framework by Nous Research. Hermes operates across terminal, desktop, web, and messaging interfaces, providing multi-provider LLM backends, persistent memory, and skill-based continuous learning.

> [!tip] Multi-Surface Execution
> - **CLI:** `hermes chat -q "<query>"`
> - **Gateway Telemetry (Read-Only):** `hermes-gateway status --json` and `hermes-gateway port --json`
> - **Desktop App:** KDE Plasma 6 launcher via `/usr/local/bin/zoth-konsole --title "Hermes Agent" -- hermes`
> - **TUI:** Ink terminal user interface (`hermes --tui`)
> - **Dashboard:** Ephemeral loopback web cockpit (`127.0.0.1:<discovered-port>`) + Zoth Studio Dual-Theme Telemetry Panel (`/workstations/connectors` & `/workstations/mission-control`)

## Architecture & Capabilities

- **User Systemd Gateway Daemon:** Managed by [[OS/Daemons/Daemon hermes-gateway|Daemon hermes-gateway]] (`hermes-gateway.service`) multiplexing 8 profiles over `~/.hermes/gateway.sock` (`0600`) and a dynamically assigned loopback TCP port (`127.0.0.1:<port>`).
- **Tool Calling:** Native OpenAI / Anthropic format tool invocation.
- **Skill Engine:** 150+ modular skills loaded on-demand from `~/.hermes/hermes-agent/skills/`.
- **Subagent Delegation:** Quick bounded task delegation via `delegate_task`.
- **STDP Memory Bridge:** Bidirectional memory sync with [[Zoth Memory]] (`:8094`).

## See Also

- [[OS/Daemons/Daemon hermes-gateway|Daemon hermes-gateway]]
- [[Skills/Skill hermes-agent|Hermes Agent Skill Reference]]
- [[00 Home]]
- [[Zoth Autonomous Agents & Hermes Fleet.canvas|Hermes Fleet Canvas]]
