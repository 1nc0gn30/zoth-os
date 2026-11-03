---
title: "ascii-video"
tags: [skill, hermes]
aliases: ["ascii-video"]
---

# ascii-video

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/creative/ascii-video/SKILL.md`

## Overview
The `ascii-video` skill provides a production pipeline for transforming video, audio, and generative procedural inputs into colored ASCII video deliverables (MP4, GIF, or image sequences).

## When to Load
Load this skill when:
- Creating terminal-style video animations, retro text visualizations, or matrix effects.
- Transforming source video files into ASCII art representations.
- Building audio-reactive visualizers with frequency band analysis and beat detection.
- Assembling animated lyric videos, text overlays, or spoken quote narrations.

## Technical Architecture & Workflow
- **Stack**: Single self-contained Python script using NumPy, SciPy (signal processing), Pillow (rasterization), and ffmpeg CLI for media encoding without GPU requirements.
- **Pipeline Stages**:
  1. **Input & Analysis**: Decodes source footage and analyzes audio frequencies or visual contrast.
  2. **Scene Rendering**: Multi-grid composition rendering to `uint8` pixel arrays with character palette density maps.
  3. **Adaptive Tonemapping**: Normalizes brightness across scenes via percentile-based gamma curves instead of linear multipliers.
  4. **Shading & Feedback**: Post-processing with `ShaderChain` and `FeedbackBuffer` for effects like bloom, CRT scans, or color trails.
  5. **Encoding**: Piped parallel frame encoding to ffmpeg for H.264 MP4 or GIF outputs.

## See also

[[MOC Skills]] · [[Zoth OS]]