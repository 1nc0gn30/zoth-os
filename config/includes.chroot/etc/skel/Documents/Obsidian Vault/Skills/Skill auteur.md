---
title: "auteur"
tags: [skill, hermes]
aliases: ["auteur"]
---

# auteur

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/auteur/SKILL.md`

## Overview
The `auteur` skill designs and constructs cinematic web pages and coherent design systems through strict art direction, executable anti-slop gates, and visual QA verification.

## When to Load
Load this skill when:
- Building or redesigning high-end marketing pages, landing pages, or product portfolios where generic designs are unacceptable.
- Implementing cinematic scroll storytelling, scroll-scrubbed video, or choreographed animations.
- Creating multi-screen products (apps, dashboards, admin panels) requiring unified design systems without visual drift.
- Auditing web interfaces against anti-slop rules, dropped animation frames, and contrast benchmarks.

## Operational Registers & Gates
- **Three Registers**:
  - `build`: Single conventional web surface following a defined art direction.
  - `direct`: Cinematic, scroll-directed flagship page with storyboards and scenes.
  - `system`: Multi-route product governed by a shared component contract and route map.
- **The Commit-Sheet**: Mandatory pre-code decision record defining the visual peak, OKLCH palette, type pairing, grid break, motion budget, and anti-reflexes.
- **Automated QA Gates**:
  - `slopscan.mjs`: Fails builds on banned styling patterns and generic defaults.
  - `shoot.mjs`: Captures triple-viewport screenshot journeys for visual inspection.
  - `systemscan.mjs`: Crawls routes to detect component drift and missing states.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill popular-web-designs|popular-web-designs]] · [[Skill design-md|design-md]] · [[Skill p5js|p5js]]