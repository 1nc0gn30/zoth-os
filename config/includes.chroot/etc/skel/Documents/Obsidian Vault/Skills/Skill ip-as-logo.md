---
title: "ip-as-logo"
tags: [skill, hermes]
aliases: ["ip-as-logo"]
---

# ip-as-logo

`ip-as-logo` is a Hermes workstation skill adapted from `s1dashu/ip-as-logo-skill` for generating minimal, cute IP character mascots that remain legible and recognizable down to 32×32 pixel dimensions.

- **Origin:** Hermes workstation skill (upstream `s1dashu/ip-as-logo-skill`, not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/creative/ip-as-logo/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Designing a mascot, brand IP character, or cute logo mark for a software repository, product, or community.
- Establishing an ultra-simplified visual identity that scales cleanly from full canvas down to favicon/dock sizes.
- Formulating structured prompt skeletons for image generators without triggering presentation frames or mockups.

## Key Capabilities & Rules

- **Complexity Budget:** Limits character construction to 4–7 large geometric shapes, one defining silhouette feature, and exactly three semantic colors (two IP body colors + one solid background color).
- **Compositional Constraints:** Characters emerge from the lower-left or lower-right corners filling 85–95% of the square canvas; centering and sharp angles are avoided.
- **Prompt Architecture:** Uses a pure pictorial description without keywords like "logo" or "icon" to prevent image models from rendering borders, cards, or watermarks.
- **Generation Workflow:** Generates individual full-resolution square assets via the Hermes `image_generate` tool, delivering each candidate draw as-is.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pixel-art|pixel-art]]