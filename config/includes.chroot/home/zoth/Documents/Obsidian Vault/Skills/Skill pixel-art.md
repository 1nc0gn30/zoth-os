---
title: "pixel-art"
tags: [skill, hermes]
aliases: ["pixel-art"]
---

# Pixel Art Generator & Animator

A workstation skill from Hermes for converting source images into retro pixel art using era-accurate hardware palettes and animating them into looping MP4 videos or GIFs.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/pixel-art/SKILL.md`

## When to load
Load this skill when generating retro pixel art or animated pixel graphics:
- Converting photos, drawings, avatars, or posters into 8-bit or 16-bit retro pixel aesthetics.
- Matching specific retro console or computer hardware color palettes: NES (54 colors), Game Boy (4-shade DMG or Pocket), PICO-8 (16 fixed), C64, Apple II, SNES, or CRT phosphor monitors (amber/green).
- Generating looping ambient video or GIF animations featuring weather and atmospheric particle effects.
- Creating pixelated social media assets, game sprites, or album art.

## Key tools & pipeline architecture
- **Image conversion (`pixel_art.py`):**
  - Adjusts contrast, saturation, and posterization to simplify tonal regions.
  - Downscales source images using `Image.NEAREST` based on block size (e.g., 4px to 10px).
  - Quantizes colors using Floyd-Steinberg dithering against named hardware palettes or adaptive N-color quantization.
  - Upscales back with nearest-neighbor interpolation to ensure sharp pixel edges.
- **Procedural animation (`pixel_art_video.py`):**
  - Applies procedural particle loops across customizable scenes: `night` (stars, fireflies), `urban` (rain, neon pulse), `snow` (snowflakes), `fire` (embers), and `tavern` (dust motes).
  - Renders video via `ffmpeg` (`libx264`, `yuv420p`, crf 18) with optional optimized GIF generation (`palettegen` / `paletteuse`).
- **Interactive clarification:** Uses a two-step prompt pattern (`clarify`) to let users select hardware presets and animation scenes.

## See also

[[MOC Skills]] · [[Zoth OS]]