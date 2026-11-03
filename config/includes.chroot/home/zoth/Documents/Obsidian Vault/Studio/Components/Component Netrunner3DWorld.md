---
title: "Netrunner3DWorld"
tags: [studio, component]
---

# Netrunner3DWorld

The `Netrunner3DWorld` component (`zoth-studio-v2/src/components/Netrunner3DWorld.jsx`) is a high-craftsmanship Three.js 3D cyberspace visualization canvas for sovereign memory nodes.

## What It Renders

- **Three.js Scene & Environment:**
  - **Procedural Starfield:** Spherical distribution of 2,000+ points tinted gold, cyan, and white.
  - **Obsidian Substrate Floor:** Metallic reflective ground disk overlaid with a procedural canvas cyberspace grid texture.
  - **Central Oracle Core:** Glowing central monolith and pulsing orbital energy rings representing the Lucy Oracle core.
- **Memory Nodes & Topology:**
  - 3D sphere meshes for each memory entry, color-coded by cluster (Lucy Oracle, Kernel, Consensus, Security, Vault, Pantheon).
  - Dynamic link lines visualizing inter-memory relationships and cluster affinity.
  - Specular halo shaders on active and selected nodes.
- **Controls & HUD Overlay:**
  - **OrbitControls:** Smooth mouse/touch camera orbiting with soft deceleration damping and floor angle limits.
  - **Playback & Focus Toolbar:** Controls to toggle auto-rotation (Play/Pause), reset camera vantage, focus on the currently selected node, toggle 2D HTML floating labels, and enter fullscreen.
  - **Interactive Tooltip:** Hover card displaying memory title, cluster tag, and timestamp.

## Parent & Integration

Rendered by [[Page MemoryPage|MemoryPage]] (`/memory`) as the primary interactive 3D netrunner topology explorer.

## See also

[[Zoth Studio]] · [[MOC Components]]