---
title: "GoldenZLogo3D"
tags: [studio, component]
---

# GoldenZLogo3D

`GoldenZLogo3D` is an interactive 2D canvas component that renders an animated, 3D-extruded golden Z emblem enclosed by the 21 Pantheon orbital rings. It serves as the primary visual mark in `Navbar.jsx` and the hero centerfold of `HomePage.jsx`.

### What it renders

- **Extruded Metallic Z Insignia:**
  - Draws a multi-layer extruded bevel creating physical depth.
  - Shaded with a 4-stop linear gold metallic gradient (`#FFF1B8`, `#F0D060`, `#B8860B`, `#6E5200`) and a specular highlight along the upper bar.
  - Implements a subtle oscillating 3D turn effect along the Y-axis.
- **21 Pantheon Orbital Rings:**
  - Simulates 3 tilted concentric orbits representing the 21 pantheon seats:
    - **Inner Orbit:** 3 core nodes (tilt: 0.15, speed: 0.55).
    - **Middle Orbit:** 6 cadre nodes (tilt: -0.35, speed: -0.38).
    - **Outer Orbit:** 12 cadre nodes (tilt: 0.7, speed: 0.24).
  - Uses depth-sorting: renders back orbital arcs behind the Z emblem and front arcs across the foreground.
  - Displays individual glowing spherical nodes when rendered at hero resolutions (`size >= 96px`).
- **Interaction & Responsive Scaling:**
  - Accepts static pixel numbers or responsive MUI breakpoint objects (`xs`, `sm`, `md`, `lg`, `xl`).
  - Hi-DPI scaling using `devicePixelRatio` (capped at 2x).
  - On mouse hover, smoothly accelerates orbital rotational speed from 0.012 to 0.045 rad/frame.

## See also

[[Zoth Studio]] · [[MOC Components]]