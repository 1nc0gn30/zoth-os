---
title: "zoth-fastfetch"
tags: [os, cli]
aliases: ["zoth-fastfetch"]
---

# zoth-fastfetch

`file`: Bourne-Again shell script.

`zoth-fastfetch` is a custom terminal telemetry HUD and system banner script (v5.0) located at `/usr/local/bin/zoth-fastfetch`.

### Features & Telemetry Display

- **Mode-Aware Color Palettes**: Inspects `~/.config/zothos/current_mode` and dynamically applies ANSI styling:
  - `matrix`: Bright emerald phosphor palette (`Hermetic Matrix`).
  - `ghost`: Rose/crimson palette (`Ghostmode NullAI [Tor Cloaked · Amnesic]`).
  - `gold`: Solar amber and gold palette (`Azoth Gold Sanctum [Radiant Solar Alchemy]`).
  - `incognito` / `win11`: Azure blue palette (`Incognito Chameleon [Windows 11 Corporate Disguise]`).
- **Live System Vitals**:
  - Kernel release, architecture, and hostname.
  - Calculated planetary hour (Sol, Venus, Mercury, Luna, Saturn, Jupiter, Mars) and hermetic element (Fire, Air, Water, Earth, Quintessence).
  - CPU and RAM bar gauges with active core count and megabyte metrics.
  - Security posture (Kali + Parrot tool repositories status).
  - Tor network status (checks `/run/zoth_ghostmode.state` or `tor.service`).
  - Local AI engine status (detects running `ollama`, `vllm`, or `litellm` processes).
  - Sovereign communication bridges (SimpleX `:5225`, Signal Bridge `:8765`, API `:8767`).
  - Zoth Studio v2 status indicator and system uptime.
- **ASCII Welcome Banner**: Renders the multi-line ZOTHOS ASCII header followed by quick command aliases and environment mode toggle instructions (`zoth-mode`).

## See also

[[Zoth OS]] · [[MOC CLIs]]