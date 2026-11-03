---
title: "songsee"
tags: [skill, hermes]
aliases: ["songsee"]
---

# songsee

Workstation skill from Hermes (not a Zoth product). CLI audio feature visualization tool by Peter Steinberger (`steipete/songsee`).

- **Origin:** Hermes skill
- **Path:** `~/.hermes/hermes-agent/skills/media/songsee/SKILL.md`
- **Binary / Package:** `github.com/steipete/songsee/cmd/songsee` (Go)

## Overview

Generates spectrograms and multi-panel audio feature visual representations directly from audio files (WAV and MP3 natively, other formats via `ffmpeg`).

## When to Load

- Generating frequency spectrograms and audio feature plots from audio files.
- Producing multi-panel acoustic visualization grids to debug audio synthesis or DSP pipelines.
- Extracting visual artifacts for automated inspection via computer vision models (`vision_analyze`).
- Analyzing harmonic vs. percussive separation, loudness profiles, tempo curves, or pitch distributions.

## Visualization Features

- **Feature Types (`--viz`):** `spectrogram`, `mel` (mel-scaled), `chroma` (pitch class), `hpss` (harmonic/percussive separation), `selfsim` (self-similarity matrix), `loudness`, `tempogram`, `mfcc`, and `flux`.
- **Customization:**
  - Palettes: `classic`, `magma`, `inferno`, `viridis`, `gray`.
  - Slice windowing: `--start <seconds>`, `--duration <seconds>`, `--window`, `--hop`.
  - Output formats: `jpg` or `png` via standard out or `-o`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill songsee 2|songsee 2]]