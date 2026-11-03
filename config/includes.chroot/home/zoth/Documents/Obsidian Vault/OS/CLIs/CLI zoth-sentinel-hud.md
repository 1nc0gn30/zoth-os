---
title: "zoth-sentinel-hud"
tags: [os, cli]
aliases: ["zoth-sentinel-hud"]
---

# zoth-sentinel-hud

`file`: Python script.

`zoth-sentinel-hud` is a Python/Tkinter graphical overlay located at `/usr/local/bin/zoth-sentinel-hud` that provides a fast floating cockpit for interacting with the ZOTHOS Sentinel AI assistant.

### Interface & Operation

Designed to be mapped to desktop shortcuts such as `Super+A` or `Super+Space`, the HUD provides an unobtrusive desktop popup:

- **Window Presentation**: Frameless (`overrideredirect`), always-on-top floating 680x420 window centered on screen with dark styling and emerald accents.
- **Input Routing**:
  - **Commands (`!cmd`)**: Queries prefixed with an exclamation mark dispatch directly to `/usr/local/bin/zoth-sentinel exec <task>`.
  - **Natural Language**: Standard queries dispatch to `/usr/local/bin/zoth-sentinel ask <prompt>`.
- **Async Execution**: Queries run in background daemon threads with a 30-second timeout, streaming stdout/stderr back into the non-blocking response pane.
- **Keybindings**: Pressing `Escape` or clicking the header button instantly dismisses the HUD.

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-sentinel-hud`
- **Interpreter**: `/usr/bin/env python3`
- **Dependencies**: Python standard library (`tkinter`, `subprocess`, `threading`)

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-sentinel|zoth-sentinel]]