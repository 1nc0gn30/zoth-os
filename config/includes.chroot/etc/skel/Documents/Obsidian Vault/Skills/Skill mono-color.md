---
title: "mono-color"
tags: [skill, hermes]
aliases: ["mono-color"]
---

# mono-color

Generate one- or two-ink editorial print poster images.

- **Origin:** Hermes skill (workstation skill, not a Zoth product; adapted from Yan Liu)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/mono-color/SKILL.md`

## Overview & When to Load

Load when designing monochrome editorial posters, duotone prints, risograph zines, halftone photographic treatments, or one-/two-ink magazine covers. Does not trigger merely because a prompt mentions a color.

## Visual Grammar & Constraints

- **Strict Inking Rule:** Never exceeds two printing inks. Substrate is not an ink; overprint mixing does not count as a third ink. Full-color palettes, gradients, and rainbow accents are prohibited.
- **Print Modes:**
  - *Pure one-ink*: Single pigment on substrate.
  - *Chromatic ink + black*: Chromatic plate carries imagery; carbon/charcoal handles typography.
  - *Complementary duotone*: Dominant plate (70–85%) plus accent plate (15–30%); defaults to Cobalt `#2148B8` + Terracotta `#C65F38`.
  - *Overprint duotone*: Deliberate plate overlap creating darker tonal intersections.
- **Design System Catalog:** Substrates are strictly neutral (Neutral White `#FAFAF7`, Cool Gray `#E9E9E5`, or Pale Beige `#F5F1E8`). Enforces 25–55% empty paper, 5–9% margins, and a dominant focal subject scaled to 45–80% of the page.
- **Typography & Text Integrity:** Preserves user-supplied text verbatim in its original language without translation; maintains a 5–12x scale jump across ≤3 type voices.
- **Delivery:** Compiles prompt into five structured paragraphs (canvas/ink, composition, subject, typography, material avoids), runs `image_generate`, and saves outputs under `./mono-color-output/`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill baoyu-infographic|baoyu-infographic]] · [[Skill meme-generation|meme-generation]] · [[Skill pixel-art|pixel-art]]