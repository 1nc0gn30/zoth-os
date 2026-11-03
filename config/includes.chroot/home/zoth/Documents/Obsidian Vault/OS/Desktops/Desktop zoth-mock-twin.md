---
title: "Zoth Mock Twin"
tags: [os, desktop]
aliases: ["zoth-mock-twin", "Launch Mock Twin Dashboard", "Zoth Mock Twin"]
---

# Zoth Mock Twin

Deterministic offline API simulation, chaos fault injection, and token cost avoidance for AI agents.

## Desktop Entry Details

- **Name:** `Zoth Mock Twin`
- **Generic Name:** `Autonomous Offline API Simulator & Network Twin`
- **Comment:** `Deterministic offline API simulation, chaos fault injection, and token cost avoidance for AI agents`
- **Exec:** `/usr/local/bin/agent-mock-twin serve`
- **TryExec:** `/usr/local/bin/agent-mock-twin`
- **Icon:** `zoth-mock-twin`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Development;Testing;X-ZothOS-AI;`
- **Keywords:** `mock;twin;simulator;har;openapi;testing;tokens;offline;ai;agent;`
- **Startup Notify:** `true`
- **Actions:** `Stats`, `Dashboard`
- **File:** `/usr/share/applications/zoth-mock-twin.desktop`

## Launch Configuration & Actions

The desktop entry classifies Zoth Mock Twin under Development, Testing, and X-ZothOS-AI categories. Launching the main entry executes `/usr/local/bin/agent-mock-twin serve` to spin up local deterministic API emulation. Context menu actions include:
- **Mock Twin Savings Stats:** runs `/usr/local/bin/zoth-konsole --pause --title "Mock Twin Stats" -- /usr/local/bin/agent-mock-twin stats`
- **Launch Mock Twin Dashboard:** opens `xdg-open http://127.0.0.1:8097`

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-mock-twin|zoth-mock-twin]] · [[CLI agent-mock-twin|agent-mock-twin]] · [[CLI zoth-konsole|zoth-konsole]]