---
title: "claude-motion"
tags: [skill, agy]
aliases: ["claude-motion"]
---
# claude-motion

`claude-motion` is an **AGY** motion design and engineering toolkit (adapted from `whaleyxbt/claude-motion`) that provides deterministic Remotion video generation, procedural audio synthesis, and visual self-review pipelines.

- **Origin:** AGY (`~/.gemini/config/skills/claude-motion/SKILL.md`)
- **When to load:** Load when generating programmatic Remotion videos, 60 fps Three.js web simulations, procedural sound effects, or running automated visual critique loops on animation frames.

### Architecture & Key Pillars
- **Temporal Determinism:** Ensures animations are pure mathematical functions of frame number or time `t`, using seeded pseudorandom generators (`rand(n)`) instead of uncontrolled timers or `Math.random()`.
- **Unified Timeline (`timeline.json`):** Central beat sheet where all visual events, audio cues, and review timestamps reference shared beat timings in seconds.
- **Zero-Dependency Procedural Audio (`scripts/sfx/`):** Pure Python standard-library sound synthesis engine generating clicks, whooshes, chimes, risers, and pads, normalized and mastered to −14 LUFS (ITU-R BS.1770 / EBU R128).
- **Visual Self-Review Loop (`sheet.mjs`):** Generates high-resolution contact sheets capturing settled frames (+0.3s after each beat) so agents can critique visual quality and typography before rendering final video.
- **Dual Rendering Pipelines:**
  - *Remotion (`src/`):* React-based composition for kinetic typography, UI reveals, and feature announcements.
  - *Web Simulations (`sims/`):* Headless Chromium capture (`capture.mjs`) rendering 60 fps particle systems and Three.js scenes to MP4.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-motion-graphics 2]]