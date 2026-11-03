---
title: "manim-video"
tags: [skill, hermes]
aliases: ["manim-video"]
---

# manim-video

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/creative/manim-video/SKILL.md`

## Overview
Provides production guidelines and rendering workflows for generating 3Blue1Brown-style educational animations and algorithmic explainers using Manim Community Edition (CE).

## When to Load
- Producing programmatic animations explaining math concepts, formulas, and proofs.
- Visualizing algorithm logic, graph traversal, and dynamic data structures.
- Animating LaTeX equation derivations and symbol morphing with `TransformMatchingTex`.
- Designing architectural schematics, scientific figures, and educational videos.
- Rendering spatial geometry and rotating 3D parametric surfaces using `ThreeDScene`.
- Managing video drafts, high-resolution rendering batches, and ffmpeg clip concatenation.

## Pipeline & Architecture
- **Pipeline Stages:** Planning narrative arcs (`plan.md`), writing modular Python scene classes (`script.py`), draft compilation (`-ql`), production rendering (`-qh`), and clip assembly (`final.mp4`).
- **Production Rules:** Opacity hierarchy (primary 1.0, secondary 0.4, grid 0.15), uniform monospace fonts to avoid kerning defects, and pacing pauses.
- **Prerequisites:** Python 3.10+, Manim CE v0.20+, LaTeX (`texlive`), and ffmpeg.

## See also

[[MOC Skills]] · [[Zoth OS]]