---
title: "RealityBackgroundCanvas"
tags: [studio, component]
aliases: ["RealityBackgroundCanvas"]
---

# RealityBackgroundCanvas

The `RealityBackgroundCanvas` component (`zoth-studio-v2/src/components/RealityBackgroundCanvas.jsx`) is the full-viewport interactive canvas engine powering dynamic background visuals for each of the 5 Realities in Zoth Studio v2.

## Reality Visual Pipelines

The canvas reacts dynamically to the current theme selected via `RealityContext`, executing tailored 60fps animation loops:

- **Gold (`gold`)**: Renders sacred orbital geometry, 24K alchemical golden ratio particle nodes, and rotating Byzantine quorum rings.
- **Matrix (`matrix`)**: Renders a P39 green phosphor Katakana digital rain stream with mouse-reactive turbulence and Sobel directional contours.
- **Ghost (`ghost`)**: Renders a deep crimson amnesic stealth sonar field, Tor SOCKS5 node ping pulses, and volatile memory enclave grids.
- **Cyan (`cyan`)**: Renders a 4D hypercube tesseract wireframe projection with STDP Hebbian neural synapse links that ignite on cursor proximity.
- **Incognito (`incognito`)**: Renders a discreet Fluent Mica aurora mesh gradient with corporate-safe micro-particles for undercover workflows.

## Technical Specifications

- **Hardware Acceleration**: HTML5 2D Canvas with sub-pixel DPR scaling (`Math.min(window.devicePixelRatio, 1.5)`).
- **Interactive Pointer Physics**: Tracks mouse movement and click pulses to generate localized ripples, orbital deflections, and neural firing spikes.
- **Zero-Allocation Render Loop**: Pre-allocates node structures, glyph buffers, and trigonometry lookup caches to prevent GC frame stutter.
- **Lightweight CPU Profile**: Maintains cool system temperatures (< 45°C) by throttling particle counts and respecting dark/light contrast modes.

## Parent & Integration

Mounted at the root of `App.jsx` underneath UI content layers with pointer events pass-through (`pointer-events: none` on container, passive listeners on window).

## See also

[[Zoth Studio]] · [[MOC Components]] · [[MOC Themes]] · [[Component RealityContext|RealityContext]] · [[Component RealityZothBotHUD|RealityZothBotHUD]]
