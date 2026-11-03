---
title: "Hermes Agent CLI"
tags: [agent, sovereign-fleet, hermes, cli]
aliases: ["Hermes Agent", "Hermes CLI"]
role: "Multi-Interface Tool-Calling AI Agent & Terminal Cockpit"
runtime: "NousResearch Hermes / Python / Electron"
port: null
status: "active"
stdp_enabled: true
---

# 🤖 Hermes Agent CLI

Autonomous tool-calling AI agent framework by Nous Research. Hermes operates across terminal, desktop, web, and messaging interfaces, providing multi-provider LLM backends, persistent memory, and skill-based continuous learning.

> [!tip] Multi-Surface Execution
> - **CLI:** \`hermes chat -q "<query>"\`
> - **Desktop App:** Electron workspace with native DOM inspection
> - **TUI:** Ink terminal user interface (\`hermes --tui\`)
> - **Dashboard:** Sovereign web cockpit (\`hermes dashboard\`)

## Architecture & Capabilities

- **Tool Calling:** Native OpenAI / Anthropic format tool invocation
- **Skill Engine:** 150+ modular skills loaded on-demand from \`~/.hermes/hermes-agent/skills/\`
- **Subagent Delegation:** Quick bounded task delegation via \`delegate_task\`
- **STDP Memory Bridge:** Bidirectional memory sync with [[Zoth Memory]] (:8094)

## See Also

- [[Skills/Skill hermes-agent|Hermes Agent Skill Reference]]
- [[00 Home]]
- [[Zoth Autonomous Agents & Hermes Fleet.canvas|Hermes Fleet Canvas]]
