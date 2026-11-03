---
title: "RealityContext"
tags: [studio, component]
aliases: ["RealityContext", "RealityTheme"]
---

# RealityContext

The `RealityContext` component (`zoth-studio-v2/src/context/RealityContext.jsx`) is the global React context provider driving the **5-Reality Switch System** across Zoth Studio v2 and ZothOS.

## The 5 Sovereign Realities

| Reality ID | Name | Companion Bot | Accent Color | Aesthetic Profile & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| `gold` | Sovereign Gold Master | **AURUM-IX** (Archon) | `#D4AF37` | Canonical 24K Alchemical Gold, Ring-0 Sanctum, sacred orbital geometry. |
| `matrix` | Hermetic Matrix Emerald | **CIPHER-0x9D** (Phosphor) | `#00FF9D` | P39 Phosphor CRT terminal, interactive Katakana digital rain & Sobel contours. |
| `ghost` | NullAI Ghostmode Stealth | **SPECTER-V** (Wraith) | `#F43F5E` | Crimson Amnesic Stealth, Tor SOCKS5 (:9050) sonar field, MAC cloaking & zero disk footprint. |
| `cyan` | Cyber Cyan Quantum | **KITSUNE-Q9** (Familiar) | `#00F0FF` | High-frequency quantum cyan, 4D hypercube lattice & STDP Hebbian vector synapses. |
| `incognito` | Covert Chameleon Guise | **CORTEX-PRO** (Assistant) | `#38BDF8` | Undercover enterprise shell, Fluent Mica acrylic styling & corporate disguise. |

## What It Provides

- **`useReality()` Hook**: Exposes `{ realityId, realityTheme, setReality, cycleReality, realities }`.
- **State Persistence**: Syncs theme selection to `localStorage` (`zoth-reality-theme`) and URL search params (`?reality=ghost`).
- **Dynamic CSS Variable Injection**: Automatically updates root design tokens including `--reality-accent`, `--reality-bg-dark`, `--reality-card-bg`, `--reality-border`, and `--reality-radius`.
- **Keyboard Shortcuts**: Binds global hotkeys (`Shift+R`) for instantaneous reality cycling across all routes.
- **Bot Persona Binding**: Couples active UI themes directly with companion bot voice quotes, SVG icons, and interactive visual HUD states.

## Parent & Integration

Wraps the entire component tree inside `App.jsx`, providing reactive theme tokens to `Navbar`, `RealityBackgroundCanvas`, `RealityZothBotHUD`, and all 65+ Studio tools. As of commit `d184b77`, 12 core Studio routes dynamically inherit the active reality's primary accent, soft wash glow, card border, and interactive controls:
- `/` (`HomePage`)
- `/tools` (`ArsenalPage`)
- `/tools/:toolId` (`RealToolWorkspacePage`)
- `/zoth-os` (`ZothOSPage`)
- `/workstations` (`WorkstationsPage`)
- `/workstations/:workstationId` (`WorkstationDetailPage`)
- `/hexstrike` (`HexStrikePage`)
- `/swarm` (`SwarmPage`)
- `/consensus` (`ConsensusPage`)
- `/bridges` (`BridgesPage`)
- `/memory` (`MemoryPage`)
- `/ax` (`AXPage`)

## See also

[[Zoth Studio]] · [[MOC Components]] · [[MOC Themes]] · [[Component RealityBackgroundCanvas|RealityBackgroundCanvas]] · [[Component RealityZothBotHUD|RealityZothBotHUD]]
