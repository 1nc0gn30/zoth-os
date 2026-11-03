---
title: "ascii-video"
tags: [skill, hermes]
aliases: ["ascii-video"]
---

# ascii-video

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/creative/ascii-video/SKILL.md`

## Overview
The `ascii-video` skill defines an end-to-end production pipeline for converting video, audio, or generative algorithmic inputs into styled, colored ASCII animations. It renders to MP4, animated GIF, or image sequences using a standalone Python pipeline.

## When to Load
Load this skill when:
- Converting existing video footage or image sequences into ASCII character videos.
- Generating audio-reactive music visualizers driven by FFT frequency analysis.
- Producing procedural generative ASCII animations, matrix rain, particles, or mathematical visualizers.
- Creating hybrid video animations with timed lyrics, text overlays, or TTS narration.

## Pipeline Architecture & Stack
- **Stack**: Python 3.10+, NumPy (array ops), SciPy (FFT / audio features), Pillow (font rasterization), and ffmpeg (video decoding, encoding, and audio muxing). Requires no GPU.
- **6-Stage Pipeline**:
  1. `INPUT`: Loads video frames, audio samples, or procedural seed parameters.
  2. `ANALYZE`: Extracts luminance, edge vectors, or audio frequency bands.
  3. `SCENE_FN`: Renders pixel canvases across multiple character grid layers.
  4. `TONEMAP`: Normalizes brightness adaptively using percentile gamma scaling.
  5. `SHADE`: Applies shader chains and feedback buffers for CRT, bloom, or glitch effects.
  6. `ENCODE`: Streams raw RGB frames into ffmpeg pipes for H.264 or GIF rendering.

## See also

[[MOC Skills]] · [[Zoth OS]]