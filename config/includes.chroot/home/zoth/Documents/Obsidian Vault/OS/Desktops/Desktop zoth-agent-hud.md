---
title: "Zoth Agent HUD"
tags: [os, desktop]
aliases: ["zoth-agent-hud", "Zoth Agent HUD"]
---

# Zoth Agent HUD

Autonomous OS Agent Multi-Ring Controller HUD.

## Desktop Entry Details

- **Name:** `Zoth Agent HUD`
- **Comment:** `Autonomous OS Agent Multi-Ring Controller HUD`
- **Exec:** `/usr/local/bin/zoth-agent-hud`
- **Icon:** `zoth-agent-hud`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;Security;ArtificialIntelligence;`
- **Keywords:** `agent;hud;controller;autonomous;multi-ring;`
- **MimeType:** `application/x-zoth-agent-hud;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-agent-hud.desktop`

## Launch Configuration & Behavior

The desktop entry registers the Zoth Agent HUD within the System, Security, and Artificial Intelligence application categories. Launching this entry executes `/usr/local/bin/zoth-agent-hud` directly without spawning a parent terminal, registers the MIME type `application/x-zoth-agent-hud`, and enables desktop startup notification.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-agent-hud|zoth-agent-hud]]