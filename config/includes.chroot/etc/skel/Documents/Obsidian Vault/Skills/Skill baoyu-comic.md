---
title: "baoyu-comic"
tags: [skill, hermes]
aliases: ["baoyu-comic"]
---

# baoyu-comic

Hermes workstation skill adapted from `baoyu-comic` (by 宝玉 / JimLiu). Labeled as origin, not a Zoth product.

## Overview

Generates original knowledge comics (知识漫画: educational, biography, tutorial) combining structured information with flexible art styles and narrative tones.

## When to Load

Load when requested to create knowledge or educational comics, biography comics, tutorial comics, or sequences in styles like "Logicomix" from source text, URLs, file paths, or topics.

## Capabilities & Options

- **Art Styles**: `ligne-claire` (default), `manga`, `realistic`, `ink-brush`, `chalk`, `minimalist`.
- **Tones**: `neutral` (default), `warm`, `dramatic`, `romantic`, `energetic`, `vintage`, `action`.
- **Presets**: `ohmsha` (manga + neutral), `wuxia` (ink-brush + action), `shoujo` (manga + romantic), `concept-story` (manga + warm), `four-panel` (minimalist + neutral).
- **Layouts**: `standard`, `cinematic`, `dense`, `splash`, `mixed`, `webtoon`, `four-panel`.
- **Partial Workflows**: Storyboard only, prompts only, images only, or specific page regeneration.

## Execution Model

- Uses an 8-step pipeline: content analysis, user confirmation via `clarify`, storyboard and character creation, outline review, prompt generation, prompt review, rendering, and reporting.
- Image generation uses Hermes' built-in prompt-only `image_generate` tool; character consistency is maintained by embedding textual character descriptions from `characters/characters.md` into prompts.
- Reference images are parsed for text traits (style, palette, scene) rather than passed directly to the model.

## See also

[[MOC Skills]] · [[Zoth OS]]