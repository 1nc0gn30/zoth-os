---
title: "design-director"
tags: [skill, agy]
aliases: ["design-director"]
---

# design-director

- **Origin:** Gemini / AGY skill (`~/.gemini/config/skills/design-director/SKILL.md`)
- **When to load:** Load first for any UI, landing page, component design, or visual polish task. Pairs with `motion-choreography` and `ui-verification-loop`.

## Overview & Philosophy

`design-director` establishes the design judgment framework for building polished user interfaces through restraint, strict visual hierarchy, and screenshot verification. It treats decoration (glows, glassmorphism, gradients) as accents secondary to spatial rhythm, typography, and contrast.

## The Design & Critique Loop

1. **Read Existing System:** Extract fonts, color tokens, base spacing unit (4pt/8pt), border radii, and motion primitives before styling.
2. **Anchor Concept:** Define a single strong concept per surface (e.g., an accent seam or monospace data framing) and silence unrelated elements.
3. **Hierarchy Toolkit:** Apply styling in strict order: Space → Size → Weight & Case → Contrast (≥4.5:1) → Accent Color (≤10% of surface) → Decoration.
4. **Anti-Slop Guardrails:** Prohibits generic AI templates, excessive animations, emoji headers, centered text blocks longer than 3 lines, and invisible dark-mode shadows.
5. **Scorecard Verification:** Score implementations out of 10 across focal points, rhythm, typography, alignment, responsiveness (375px/768px/1440px), and state handling before shipping (minimum 8/10).

## See also

[[MOC Skills]] · [[Zoth OS]]