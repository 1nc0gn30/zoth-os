---
title: "MotionReveal"
tags: [studio, component]
---

# MotionReveal

`MotionReveal` is the primary animation toolkit for Zoth Studio v2, exporting reusable Framer Motion primitives used across virtually all studio routes and showcase pages.

### Architectural Features

- **IntroGate Synchronization:** Uses `useGatedInView`, gating viewport triggers behind `useIntroReleased()` so elements animate during route aperture transitions rather than firing prematurely behind intro overlays.
- **Accessibility & Reduced Motion:** Every component hooks into `useReducedMotion()`, instantly bypassing animations and blurs when reduced-motion preferences are detected.

### Exported Primitives

- **Hero Entrances (`HeroReveal`, `HeroItem`):** Staggers hero titles, tags, and action buttons with vertical rise, opacity fade, and de-blurring (`blur(6px) -> blur(0px)`).
- **Viewport Reveals (`RevealOnScroll`):** Scroll-triggered reveals with configurable presets (`fadeUp`, `fadeIn`, `scaleUp`, `slideLeft`, `slideRight`) using exponential easing.
- **Grid Staggering (`StaggerChildren`, `StaggerItem`):** Orchestrates sequential card reveals in grids and list layouts.
- **Accents & Effects:**
  - `GlowLine`: Draws in an illuminated gold gradient horizontal rule from left to right.
  - `ParallaxGlow`: Binds background radial blooms to page scroll depth via `useScroll` and `useTransform`.
  - `SplitText`: Deconstructs headings into word tokens that stagger into view.
  - `FloatingElement`: Continuous sinusoidal floating oscillation for 3D badges and logos.
  - `CountUp`: Eased numeric counter for metrics and KPI displays.
  - `MagneticHover`: Spring-driven hover and tap micro-interaction wrapper.

## See also

[[Zoth Studio]] · [[MOC Components]]