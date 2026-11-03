---
title: "design-director"
tags: [skill, grok]
aliases: ["design-director"]
---

# design-director

- **Origin:** Grok skill (`~/.grok/skills/design-director/SKILL.md`)
- **When to load:** Load first for any UI, landing page, component design, or visual polish task. Pairs with `motion-choreography` and `ui-verification-loop`.

## Overview & Philosophy

`design-director` provides the judgment layer and systematic critique methodology required for high-end UI design. It prioritizes restraint, visual consistency, and empirical screenshot verification over unearned decoration like random glows, blobs, or complex gradients.

## Core Design Workflow

1. **Read Existing System:** Audit theme files, CSS variables, typography roles, base spacing (4pt/8pt), border radii, and motion tokens before writing code.
2. **Anchor Concept:** Choose one single visual idea per surface (such as a 2px accent seam line or monospace data header framing) and subordinate all other elements to it.
3. **Hierarchy Hierarchy:** Structure interfaces strictly: Space → Size → Weight & Case → Contrast (≥4.5:1) → Accent Color (≤10% of viewport) → Decoration.
4. **Anti-Slop Criteria:** Avoid generic AI aesthetic cliches (purple/blue hero blobs, unneeded infinite animations, emoji icons in headers, >3 lines of centered text).
5. **Scorecard Verification:** Evaluate renders against a 10-point rubric (focal point, rhythm, typography, contrast, alignment, responsiveness across 375px/768px/1440px) to achieve at least an 8/10 before shipping.

## See also

[[MOC Skills]] · [[Zoth OS]]