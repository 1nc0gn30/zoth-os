---
title: "hyperframes"
tags: [skill, hermes]
aliases: ["hyperframes"]
---

# hyperframes

Deterministic HTML, CSS, and GSAP video rendering engine outputting to MP4 and WebM via headless Chrome and FFmpeg.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/hyperframes/SKILL.md`
- **Prerequisites:** `node` (>=22), `ffmpeg`, `npx`, and `chrome-headless-shell`

## Purpose & Overview

The `hyperframes` skill treats HTML as the source of truth for video composition. Compositions use `data-*` timing attributes, GSAP timelines, and CSS styling to produce frame-by-frame captures encoded into MP4 or WebM files using FFmpeg.

## When to Load

- Generating rendered MP4/WebM videos from text scripts, websites, or HTML layouts.
- Creating motion graphics, animated lower-thirds, typographic intros, and social media video overlays.
- Synchronizing text-to-speech (TTS) voiceovers and captions with audio waveforms.
- Designing audio-reactive visuals (beat tracking, pulsing glow, spectrum modulations).
- Applying shader-based or CSS transitions between multi-scene layouts.
- Running deterministic video pipelines where animations must reproduce identically frame-by-frame.

## Core Commands

- `npx hyperframes init <name>`: Scaffolds a new video composition project from templates.
- `npx hyperframes lint`: Audits timelines, composition IDs, and track overlaps.
- `npx hyperframes validate`: Performs automated WCAG contrast checks across video timestamps.
- `npx hyperframes preview`: Launches a local preview server with live reloading.
- `npx hyperframes render --output final.mp4`: Captures frames and encodes the final video.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill manim-video|manim-video]] · [[Skill meme-generation|meme-generation]]