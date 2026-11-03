---
title: "dream-loop"
tags: [skill, hermes]
aliases: ["dream-loop"]
---

# dream-loop

Autonomous visual fidelity loop for constructing real-time 3D scenes and WebGL/Three.js environments by generating AAA concept art targets and iterating code against a gated scoring ladder.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/dream-loop/SKILL.md`
- **Author:** Anshu Chimala (adapted by Nous Research)

## When to Load
Load this skill when tasked with building real-time 3D browser graphics, WebGL games, or Three.js environments where achieving visual fidelity, physically plausible lighting, realistic materials, and 60+ FPS performance is the primary objective.

## Required Tooling
- **Concept Art & Texturing:** `image_generate` for generating photorealistic target renders and texture maps.
- **Runtime Capture:** `browser_exec` (or headless browser) to serve and screenshot the live canvas at matching resolutions.
- **Evaluation:** `vision_analyze` (often paired with stitched side-by-side composites via ImageMagick/PIL).

## Gated 5-Tier Scoring Ladder
The loop executes iteratively against an art-director judging rubric:
1. **Tier 1 (0–3) — Shape & Composition:** Camera perspective, framing, object positioning, and scale layout.
2. **Tier 2 (3–5) — Light & Color:** Directional key light, exposure balance, shadow depth, atmosphere, and palette.
3. **Tier 3 (5–7) — Materials & Surfaces:** Plausible roughness, normals, specular reflection, and physical material textures.
4. **Tier 4 (7–9) — Fine Detail:** High-precision asset detail, edge alignment, and micro-refinements.
5. **Tier 5 (9–10) — Indistinguishable:** Side-by-side equivalence with target concept art.

## Exit Criteria
Convergence is reached when the build achieves a score $\ge 8$ with target frame rates (e.g., 60 FPS in-browser), or when optimization plateaus are reached.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill p5js|p5js]] · [[Skill claude-design|claude-design]] · [[Skill manim-video|manim-video]]