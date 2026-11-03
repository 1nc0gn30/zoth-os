---
title: "meme-generation"
tags: [skill, hermes]
aliases: ["meme-generation"]
---

# meme-generation

Create meme PNGs from templates with Pillow text overlay.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/meme-generation/SKILL.md`

## Overview & When to Load

Load when a user requests meme creation, asks to "meme this", or wants visual humor for a specific scenario or technical frustration.

## Key Modes & Workflow

- **Classic Templates (Default):**
  - Uses `scripts/generate_meme.py` to overlay white text with black outlines on classic meme formats.
  - Supports ~100 dynamic imgflip templates (searched via `--search`) and 10 hand-tuned curated templates: `this-is-fine`, `drake`, `distracted-boyfriend`, `two-buttons`, `expanding-brain`, `change-my-mind`, `woman-yelling-at-cat`, `one-does-not-simply`, `grus-plan`, and `batman-slapping-robin`.
  - Template images are cached locally under `scripts/.cache/`.
- **Custom AI Scenes (with `image_generate`):**
  - Generates a scene with AI without text in the prompt, then runs `generate_meme.py --image` to overlay text.
  - Offers direct text overlay or top/bottom black `--bars` for busy backgrounds, verified via vision analysis if available.
- **Rules & Constraints:**
  - Keep captions concise (8–12 words max per field).
  - Match arguments to the template's required field count.
  - Outputs rendered PNG images to `~/.hermes/cache/scratch/meme.png` delivered via the `MEDIA:` protocol.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill ascii-art|ascii-art]]