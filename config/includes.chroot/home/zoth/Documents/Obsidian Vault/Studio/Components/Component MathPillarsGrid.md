---
title: "MathPillarsGrid"
tags: [studio, component]
---

# MathPillarsGrid

`MathPillarsGrid` renders an interactive card grid presenting the Six Mathematical Pillars of Zoth AI architecture. It is embedded within `MathPillarsPage` (`variant="full"`), `DocsPage`, and as an abridged preview on `HomePage` (`variant="teaser"`).

### What it renders

- **Tier Selection Bar (Full Variant):**
  - Renders interactive filter chips from `mathTiers` allowing users to switch formula complexity levels (e.g., Foundational, Intermediate, Advanced).
  - Displays guidance noting that formula representations change according to mathematical rigor while describing the same core principles.
- **Pillar Cards (6 Total):**
  - Each card features a top accent border matching `pillar.accent` and a chip indicating the Roman numeral (`Pillar I` through `Pillar VI`).
  - **Formula Container:** Monospace terminal box presenting the mathematical expression for the selected tier (`pillar.tiers[tier]`), defaulting to Intermediate in teaser mode.
  - **Pillar Metadata:** Displays the pillar title, descriptive subtitle, and an action button linking to the dedicated deep-dive page (`/docs/math/:id`).
- **Interactive Tooling (Full Variant):**
  - **Copy Proof:** Copies the formatted formula and tier context directly to the system clipboard.
  - **Audio Readout (Listen/Stop):** Uses browser Web Speech API (`SpeechSynthesisUtterance`) to synthesize and narrate the formula aloud.

## See also

[[Zoth Studio]] · [[MOC Components]]