---
title: "SwarmCanvasVisualizer"
tags: [studio, component]
---

# SwarmCanvasVisualizer

The `SwarmCanvasVisualizer` component (`zoth-studio-v2/src/components/SwarmCanvasVisualizer.jsx`) is an interactive 2D HTML5 canvas visualizer that models the 21-agent Pantheon swarm mesh and real-time telemetry.

## What It Renders

- **2D Canvas Simulation:**
  - **Background & Radar Sweep:** Grid background with a rotating conic gradient radar sweep centered on the canvas.
  - **Force-Directed Agent Mesh:** 21 agent nodes grouped by cadre into concentric clusters with soft spring and repulsion physics.
  - **Cadre Color Coding:** Architects (gold), Code (sky), Security (red), Creative (violet), and Swarm (emerald), with core triad nodes (`AZOTH`, `AETHER`, `MERCURY`) at the center.
  - **Dynamic Topology & Packets:** Proximity connection lines between neighboring nodes and glowing data packets traversing active links.
  - **Interactive Hover & Hit Detection:** Highlights connected links and dims unrelated nodes when hovering over an agent.
- **Bridge Telemetry:**
  - Polls the local daemon bridge (`http://127.0.0.1:8102/api/stats`) every 5 seconds.
  - Gracefully falls back to offline state when the bridge daemon is inactive.
- **HUD & Status Bar:** Displays connection status chip, active agent counts, and cadre distribution indicators.

## Parent & Integration

Rendered in [[Page SwarmPage|SwarmPage]] (`/swarm`) and inside the interactive [[Component SwarmFrameJourney|SwarmFrameJourney]] component.

## See also

[[Zoth Studio]] · [[MOC Components]]