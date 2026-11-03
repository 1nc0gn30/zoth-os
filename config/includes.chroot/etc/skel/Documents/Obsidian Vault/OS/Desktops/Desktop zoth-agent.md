---
title: "Zoth Agent CLI"
tags: [os, desktop]
aliases: ["zoth-agent", "Zoth Agent CLI"]
---

# Zoth Agent CLI

Autonomous OS Agent CLI Interface.

## Desktop Entry Details

- **Name:** `Zoth Agent CLI`
- **Comment:** `Autonomous OS Agent CLI Interface`
- **Exec:** `xfce4-terminal -T 'ZOTHOS Agent Terminal' -e 'zoth-agent-os'`
- **Icon:** `zoth-agent`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;ArtificialIntelligence;`
- **Keywords:** `agent;cli;autonomous;os;terminal;`
- **MimeType:** `application/x-zoth-agent-cli;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-agent.desktop`

## Launch Configuration & Behavior

The desktop entry registers the Zoth Agent CLI under System and Artificial Intelligence categories. It invokes `xfce4-terminal` with the title "ZOTHOS Agent Terminal" executing `zoth-agent-os`, mapping to the `application/x-zoth-agent-cli` MIME type and displaying the `zoth-agent` icon.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-agent-os|zoth-agent-os]] · [[CLI xfce4-terminal|xfce4-terminal]]