---
title: "Hermes Agent"
tags: [os, desktop]
aliases: ["hermes-agent", "Hermes Agent"]
---

# Hermes Agent

Hermes Agent Autonomous Gateway desktop launcher.

## Desktop Entry Details

- **Name:** `Hermes Agent`
- **Comment:** `Hermes Agent Autonomous Gateway`
- **Exec:** `/usr/local/bin/zoth-konsole --title "Hermes Agent" -- hermes`
- **Icon:** `hermes-agent`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `X-Zoth-AI;Development;ArtificialIntelligence;`
- **Keywords:** `hermes;agent;gateway;autonomous;ai;`
- **MIME Type:** `application/x-hermes-agent;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/hermes-agent.desktop`

## Launch Configuration & Behavior

The desktop entry registers the Hermes Agent autonomous gateway within the KDE Plasma 6 desktop menu under `X-Zoth-AI`, `Development`, and `ArtificialIntelligence`. Activation launches `/usr/local/bin/zoth-konsole` with the title `"Hermes Agent"`, executing the `hermes` wrapper (which resolves `$HOME/.hermes/hermes-agent/.hermes/bin/hermes` first). The desktop file includes MIME handling for `application/x-hermes-agent` and specifies `StartupNotify=true`.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[OS/Daemons/Daemon hermes-gateway|Daemon hermes-gateway]] · [[CLI hermes|hermes]] · [[Pkg hermes|hermes]]
