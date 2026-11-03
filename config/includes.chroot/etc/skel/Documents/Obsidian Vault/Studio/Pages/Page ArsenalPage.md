---
title: "ArsenalPage"
tags: [studio, page]
---

# ArsenalPage

`ArsenalPage` is the unified tool and asset directory in Zoth Studio, rendered at route `[[Route arsenal|/arsenal]]`.

## Rendered Capabilities

- **Unified Asset Catalog**: Renders the complete inventory of sovereign developer tools, workstations, and micro-repositories managed across the studio ecosystem.
- **Domain Categorization**: Filters modules across 10 operational categories, including Security & Network, Simulation & Testing, Memory & Brain, Swarm & Core, Autonomous Web, Planning, and Media & 3D.
- **Search & Layout Modes**: Offers real-time textual search across tool names, descriptions, tags, and IDs, with responsive layout toggling between grid and compact card views.
- **Asset Cards & Launchers**: Each card details:
  - Execution environment (Local Sovereign Node, WebGPU In-Browser, or Bare-Metal Enclave).
  - Zero-Egress verification badge.
  - One-click copyable pull / install command.
  - Action button routing directly to the active workspace (`/tools/:toolId`) or workstation page, alongside GitHub source links.
- **Ecosystem Stats Banner**: Displays summary counts for air-gapped modules, zero-egress tools, and local execution readiness.

- **Source File:** `zoth-studio-v2/src/pages/ArsenalPage.jsx`
- **Parent / Route:** Served at `/arsenal` (legacy `/templates` route redirects here)

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route arsenal|/arsenal]]