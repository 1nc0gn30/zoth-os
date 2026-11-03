---
title: "scrollcraft"
tags: [skill, hermes]
aliases: ["scrollcraft"]
---

# scrollcraft

Design methodology and engineering pipeline for building high-end scroll-driven landing pages ("scrollytelling"). It treats page scrolling as a video and animation scrubber timeline over semantic, token-styled HTML.

- **Origin:** Hermes workstation skill (not a Zoth product; upstream by nateherkai)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/web-development/scrollcraft/SKILL.md`

### When to Load
- Designing immersive "Apple-style" landing pages, video-scrubbing narratives, or interactive brand showcase experiences.
- Building scrollytelling websites where user scroll progresses choreographed scenes and visual transitions.
- Eliminating cookie-cutter template patterns by requiring distinct device families, feeling curves, and bespoke signature interactions.

### Pipeline & Standards
- **Structured Briefing:** Starts with an 8-question interview establishing tone, emotional energy curves, and an engineered peak moment stored in `BRIEF.md`.
- **Grammar & Fingerprint Gate:** Selects a discrete layout grammar and verifies distinctness against prior projects in `FINGERPRINTS.md` across 6 design axes.
- **Dense GOP Video Encoding:** Prepares scrubbing video assets via `encode.sh` with keyframe-dense intra-frames to ensure seamless backwards/forwards scrub without lag.
- **Token-Themed Core Engine:** Drives behavior via `data-sc-*` markup attributes and CSS variables without modifying core `scrollcraft.js` engine code.
- **Multi-Frame Verification:** Generates multi-viewport contact sheets at successive scroll depths to detect contrast issues, dead zones, and opacity clipping.

## See also

[[MOC Skills]] · [[Zoth OS]]