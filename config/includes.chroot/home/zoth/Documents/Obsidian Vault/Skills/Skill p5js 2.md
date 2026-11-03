---
title: "p5js"
tags: [skill, hermes]
aliases: ["p5js"]
---

# p5js

Creative coding and generative art pipeline producing standalone, browser-based [p5.js](https://p5js.org) sketches. Supports 2D and 3D WebGL rendering, GLSL shaders, interactive data visualizations, flow fields, particle dynamics, audio reactivity, and headless export.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/creative/p5js/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load
- When users request generative art, procedural compositions, or creative code sketches.
- When building interactive HTML5 canvas visualizations, kinetic typography, or visual demos.
- When creating 3D WebGL scenes, lighting models, or custom GLSL fragment/vertex shaders.
- When developing audio-reactive visualizers with `p5.sound.js` or data-driven charts.

## Architecture & Production Pipeline
- **Standalone architecture:** Implements self-contained single-file HTML applications with CDN-loaded p5.js (1.11.3 default or 2.x).
- **Core capabilities:** Integrates Perlin/curl noise fields, flocking physics, pixel manipulation filters, and FFT frequency analysis.
- **Production lifecycle:** Six-stage workflow (`CONCEPT → DESIGN → CODE → PREVIEW → EXPORT → VERIFY`).
- **Export formats:** Outputs static images (`saveCanvas` PNG), looping animations (`saveGif`), frame sequences compiled with ffmpeg (MP4), or print vectors via `p5.js-svg`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill ascii-video|ascii-video]] · [[Skill manim-video|manim-video]] · [[Skill excalidraw|excalidraw]]