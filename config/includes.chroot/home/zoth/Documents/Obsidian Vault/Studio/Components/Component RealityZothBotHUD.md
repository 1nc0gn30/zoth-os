---
title: "RealityZothBotHUD"
tags: [studio, component]
aliases: ["RealityZothBotHUD"]
---

# RealityZothBotHUD

The `RealityZothBotHUD` component (`zoth-studio-v2/src/components/RealityZothBotHUD.jsx`) is the floating companion bot HUD and reality switcher docked at the bottom-right of Zoth Studio v2.

## Companion Bot Personas

Each reality dynamically instantiates a dedicated companion bot with bespoke SVG chassis artwork, voice quotes, and status diagnostics:

| Bot Name | Reality ID | Chassis Type | Theme Badge | Voice Quote Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **AURUM-IX** | `gold` | `crowned-orb` | `RING-0 SANCTUM` | *"24K Alchemical Gold invariance locked across all routes."* |
| **CIPHER-0x9D** | `matrix` | `matrix-hood` | `P39 PHOSPHOR` | *"Katakana rain buffer streaming at 60fps with zero packet loss."* |
| **SPECTER-V** | `ghost` | `stealth-wraith` | `AMNESIC TOR` | *"Sonar perimeter sweep active — zero unauthorized outbound sockets."* |
| **KITSUNE-Q9** | `cyan` | `kitsune-mecha` | `STDP TENSOR` | *"Firing Hebbian STDP action potentials across the 4D hypercube mesh."* |
| **CORTEX-PRO** | `incognito` | `fluent-drone` | `FLUENT COVERT` | *"All offensive & sovereign daemons hidden behind corporate telemetry."* |

## Key Features

- **Interactive Bot Avatar**: Animated SVG chassis with eye tracking, glow respirations, and reactive click dialog.
- **Reality Switcher Strip**: 5-button icon strip (`RealityThemeIcon`) allowing instantaneous 1-click reality switching.
- **Dynamic Quotes & Telemetry**: Rotates contextual system status notifications and architectural lore quotes.
- **Keyboard Shortcut Display**: Visual badge indicating `Shift+R` for rapid cycling.
- **Collapsible Mini Mode**: Allows collapsing the HUD into a compact unobtrusive status gem.
- **`RealityMatrixShowcaseSection`**: Exported full-width interactive showcase section embedded directly below the Hero section on `HomePage.jsx` (and on `/zoth-os`), enabling visitors to preview and hot-swap all 5 realities, inspect each Zoth Bot's live SVG crest, and view real-time HUD telemetry.

## Parent & Integration

Mounted globally inside `App.jsx`, synchronized with `RealityContext` and overlaid above route content with responsive mobile positioning.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[MOC Themes]] · [[Component RealityContext|RealityContext]] · [[Component RealityBackgroundCanvas|RealityBackgroundCanvas]]
