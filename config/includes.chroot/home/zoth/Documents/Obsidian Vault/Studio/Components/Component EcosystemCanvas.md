---
title: "EcosystemCanvas"
tags: [studio, component]
---

# EcosystemCanvas

`EcosystemCanvas` is an animated HTML5 2D canvas visualizer component designed to render an architectural map of the Zoth sovereign tool ecosystem.

### What it renders

- **Header Surface:**
  - Wraps the canvas inside a bordered MUI `Paper` container.
  - Displays the label `✨ ZOTH SOVEREIGN ECOSYSTEM — GOLDEN ARCHITECTURE CANVAS` with a disclaimer badge reading `ROSTER MAP • NOT LIVE TELEMETRY`.
- **Canvas Visual Elements:**
  - **Dynamic Background Grid:** Renders a 30px Cartesian coordinate grid styled to adapt between dark and light themes.
  - **Rotating Concentric Rings:** Animates two counter-rotating golden elliptical orbits around the center.
  - **Central Z Emblem:** Draws the signature golden Z logo with illuminated corner anchor points and drop-shadow glow effects.
  - **Orbital Tool Nodes:** Simulates 8 satellite nodes rotating at a 140×65px elliptical radius, connected to the central emblem via dynamic radial vector lines.
- **Lifecycle & Performance:**
  - Automatically sizes to the parent container width with a fixed height of 260px.
  - Uses `requestAnimationFrame` for smooth frame updates and cleanly cancels the animation loop on unmount.

## See also

[[Zoth Studio]] · [[MOC Components]]