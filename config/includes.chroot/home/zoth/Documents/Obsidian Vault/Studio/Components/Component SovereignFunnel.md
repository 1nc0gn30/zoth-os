---
title: "SovereignFunnel"
tags: [studio, component]
---

# SovereignFunnel

The `SovereignFunnel` component (`zoth-studio-v2/src/components/SovereignFunnel.jsx`) is a reusable call-to-action deployment funnel guiding users through three sovereign tiers of running Zoth capabilities locally.

## What It Renders

- **Header Section:** "SOVEREIGN DEPLOYMENT FUNNEL" chip, customizable title (defaults to "Sovereign Installation & Ecosystem Deployment"), and descriptive subtitle.
- **Three Deployment Tier Cards:**
  - **Option 1: Autonomous Micro-Tool (Standalone):** Isolated zero-egress single-purpose micro-engine (customizable via `toolTitle`, `toolDescription`, `toolRepo`, and `toolCommand` props). Includes a one-click copyable git clone snippet and repository inspection button.
  - **Option 2: Zoth Studio v2 (Full Suite):** Unified developer studio cockpit (`zoth-studio-v2`) with clone command and direct GitHub link.
  - **Option 3: Sovereign Zoth OS (Bare-Metal OS):** Air-gapped operating system kernel for agent swarms and hardware enclave execution (`zoth-os`) with external repository link.
- **Interactive Feedback:** 1-click clipboard copy buttons with an animated MUI Snackbar alert confirming copy success.

## Parent & Integration

Embedded near the bottom of major Studio pages (e.g. `HomePage`, `ArsenalPage`, `RealToolWorkspacePage`, `DocsPage`, `WorkstationDetailPage`, `MemoryPage`, `WebGenPage`, `SwarmPage`, and `HexStrikePage`).

## See also

[[Zoth Studio]] · [[MOC Components]]