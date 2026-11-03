---
title: "manim-video"
tags: [skill, hermes]
aliases: ["manim-video"]
---

# manim-video

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/creative/manim-video/SKILL.md`

## Overview
Provides a structured video production pipeline for creating 3Blue1Brown-style mathematical animations, algorithmic walkthroughs, and technical explainer videos using Manim Community Edition (CE).

## When to Load
- Authoring programmatic animations for mathematical concepts, proofs, and geometric intuition.
- Animating step-by-step equation derivations using LaTeX and `MathTex`.
- Visualizing algorithm mechanics, data structures, and state transitions.
- Building animated technical diagrams, system architectures, and metric-driven data stories.
- Creating 3D geometry visualizations and parametric surface transformations with `ThreeDScene`.
- Orchestrating multi-scene video rendering and ffmpeg concatenation.

## Pipeline & Architecture
- **Workflow:** Script planning (`plan.md`), Python scene construction (`script.py`), draft rendering (`manim -ql`), final rendering (`manim -qh`), and stitching via `ffmpeg`.
- **Styling Rules:** Opacity layering for cognitive focus, monospace typography (`font=MONO`), and dedicated breathing pauses (`self.wait()`).
- **Dependencies:** Python 3.10+, Manim CE v0.20+, LaTeX distribution, and ffmpeg.

## See also

[[MOC Skills]] · [[Zoth OS]]