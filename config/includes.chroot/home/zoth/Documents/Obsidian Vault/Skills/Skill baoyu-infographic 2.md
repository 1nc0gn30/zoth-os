---
title: "baoyu-infographic"
tags: [skill, hermes]
aliases: ["baoyu-infographic"]
---

# baoyu-infographic

Hermes workstation skill adapted from `baoyu-infographic` (by 宝玉 / JimLiu). Labeled as origin, not a Zoth product.

## Overview

Generates visual summaries and infographics by combining information structure layouts with distinct aesthetic styles across 21 layouts and 21 styles.

## When to Load

Load when requested to create infographics, visual summaries, or data graphics, or when user input references terms like "信息图", "可视化", or "高密度信息大图".

## Capabilities & Options

- **Layouts (21)**: Includes `bento-grid` (default), `linear-progression`, `binary-comparison`, `comparison-matrix`, `hierarchical-layers`, `hub-spoke`, `structural-breakdown`, `dense-modules`, `circular-flow`, and `funnel`.
- **Styles (21)**: Includes `craft-handmade` (default), `technical-schematic`, `corporate-memphis`, `pop-laboratory`, `morandi-journal`, `retro-pop-grid`, `chalkboard`, and `pixel-art`.
- **Keyword Shortcuts**: Automatically selects pairings such as `dense-modules` for high-density data or `bento-grid` with `craft-handmade` for general infographics.
- **Aspect Ratios**: Supports `landscape` (16:9), `portrait` (9:16), `square` (1:1), and custom W:H ratios mapped to nearest standard options.

## Execution Model

- Follows a 7-step process: content analysis, structured content extraction, combination recommendation, user confirmation via `clarify`, prompt compilation, image generation via `image_generate`, and summary reporting.
- Preserves source statistics faithfully while stripping credentials, tokens, or API keys from outputs.
- Assembles detailed layout and style rules into `prompts/infographic.md` before invoking Hermes image generation.

## See also

[[MOC Skills]] · [[Zoth OS]]