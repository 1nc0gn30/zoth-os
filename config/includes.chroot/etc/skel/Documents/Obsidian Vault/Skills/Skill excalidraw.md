---
title: "excalidraw"
tags: [skill, hermes]
aliases: ["excalidraw"]
---

# excalidraw

Generates hand-drawn architectural diagrams, flowcharts, sequence diagrams, and concept maps by emitting standard Excalidraw JSON element trees into standalone `.excalidraw` files.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/excalidraw/SKILL.md`
- **Upload Script:** `skills/creative/excalidraw/scripts/upload.py`
- **Tags:** Excalidraw, Diagrams, Flowcharts, Architecture, Visualization, JSON

## When to Load

Load when generating `.excalidraw` files for system architecture diagrams, state machines, process workflows, or technical visualizations that can be drag-and-dropped into excalidraw.com or shared via generated URLs.

## Diagram Rules & Conventions

- **Envelope Structure:** Wraps elements in a valid JSON envelope declaring `type: "excalidraw"`, `version: 2`, and an `elements` array.
- **Container Text Binding:** Explicitly pairs shapes (`rectangle`, `ellipse`, `diamond`) with child text elements using `boundElements` on the container and `containerId` on the text. (Never use inline `"label": {"text": ...}` as it is ignored).
- **Typography & Font:** Uses `fontFamily: 1` (Virgil hand-drawn font) with minimum 16px font size for body text and 20px for titles.
- **Z-Order Progression:** Emits elements progressively (background zones → containers → bound text → connecting arrows) rather than grouping all shapes before text.
- **Sharing:** An optional upload script uses the `cryptography` package to publish directly to excalidraw.com and return a shareable URL.

## See also

[[MOC Skills]] · [[Zoth OS]]