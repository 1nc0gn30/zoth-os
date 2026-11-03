---
title: "pretext"
tags: [skill, hermes]
aliases: ["pretext"]
---

# pretext

- **Origin:** Hermes (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/pretext/SKILL.md`
- **Category:** Creative Coding / Typography

## Overview
`pretext` guides the creation of high-performance, creative browser demonstrations using `@chenglou/pretext`, a lightweight TypeScript library for DOM-free multiline text measurement and layout. Bypassing DOM reflow thrashing enables fluid text calculations and geometry manipulations at 60 FPS on HTML5 Canvas.

## When to Load
Load when building creative typography experiments, kinetic typography with per-glyph physics, text flowing dynamically around draggable obstacles or sprites, text-as-geometry browser games, or multiline shrink-wrap interfaces.

## Core Patterns & Capabilities
- **Dynamic Obstacle Reflow**: Couples `layoutNextLineRange` with row-width calculations so paragraphs dynamically flow around moving shapes and cursors.
- **Canvas & Coordinate Rendering**: Measures line breaks, grapheme positions, and bounds prior to rendering on HTML5 Canvas 2D or custom coordinate systems.
- **Zero-Build Stack**: Demos are packaged as standalone `.html` files importing `@chenglou/pretext` directly via CDN ESM.
- **Performance Optimization**: Enforces caching `prepare()` and `prepareWithSegments()` handles outside the animation loop, recomputing only layout ranges per frame.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill p5js|p5js]] · [[Skill claude-design|claude-design]] · [[Skill excalidraw|excalidraw]] · [[Skill architecture-diagram|architecture-diagram]]