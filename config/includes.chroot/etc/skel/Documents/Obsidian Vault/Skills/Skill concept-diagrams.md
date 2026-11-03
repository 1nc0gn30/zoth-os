---
title: "concept-diagrams"
tags: [skill, hermes]
aliases: ["concept-diagrams"]
---

# concept-diagrams

- **Origin:** Hermes skill (workstation skill, not a Zoth product; ported from upstream PR by v1k22)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/concept-diagrams/SKILL.md`
- **Tags:** `diagrams`, `svg`, `visualization`, `education`, `physics`, `chemistry`, `engineering`

## Overview
A visualization skill for producing flat, minimal SVG educational diagrams and technical schematics packaged into standalone, offline-ready HTML pages with responsive light and dark mode styling.

## When to Load
- Creating textbook-grade educational diagrams across STEM fields (physics mechanisms, chemical reaction pathways, biology structures).
- Illustrating physical objects, exploded part views, anatomical cross-sections, and floor plans.
- Visualizing narrative journeys, lifecycle timelines, and hub-and-spoke infrastructure topologies.
- *Alternatives:* Use [[Skill architecture-diagram|architecture-diagram]] for dark cloud tech architectures, or [[Skill excalidraw|excalidraw]] for hand-drawn whiteboard sketches.

## Design Rules & Output Format
- **Aesthetic Principles:** Pure flat design with zero drop shadows, glows, or gradients; 0.5px borders on node rectangles; 9 standardized semantic color ramps (`c-purple`, `c-teal`, `c-coral`, etc.).
- **Typography Standards:** Constrained to two sizes in sentence case (14px `.th`/`.t` and 12px `.ts`).
- **Layout Specification:** Fixed 680px viewBox width with a 40px safe margin and standard marker arrow definitions.
- **Delivery:** Generates a single, zero-dependency HTML file incorporating `templates/template.html` that opens directly in any browser.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill architecture-diagram|architecture-diagram]] · [[Skill excalidraw|excalidraw]]