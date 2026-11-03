---
title: "baoyu-article-illustrator"
tags: [skill, hermes]
aliases: ["baoyu-article-illustrator"]
---

# baoyu-article-illustrator

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/baoyu-article-illustrator/SKILL.md`

## Overview
The `baoyu-article-illustrator` skill analyzes articles, identifies key illustration insertion points, and generates structured illustrations maintaining **Type × Style × Palette** consistency across the piece.

## When to Load
Load this skill when:
- Adding cohesive diagrams, infographics, or illustrations to an article or documentation.
- Visualizing technical workflows, comparisons, architecture frameworks, or timelines.
- Generating a complete illustration plan (outlines, prompt reproducibility records, and final images).
- Harmonizing illustration aesthetics using consistent styles (e.g., notion, minimal, blueprint) and color palettes.

## Core Dimensions & Workflow
- **Three Dimensions**:
  - **Type**: Information structure (`infographic`, `scene`, `flowchart`, `comparison`, `framework`, `timeline`).
  - **Style**: Rendering treatment (`notion`, `warm`, `minimal`, `blueprint`, `watercolor`, `elegant`).
  - **Palette**: Color scheme (`macaron`, `warm`, `neon`, or style default).
- **Step-by-Step Execution**:
  1. *Analyze*: Evaluates article content, core arguments, and target illustration slots.
  2. *Outline*: Generates `outline.md` defining position, purpose, and visual content for each graphic.
  3. *Prompt Construction*: Saves structured prompt files (`prompts/NN-{type}-{slug}.md`) with concrete data labels before generating.
  4. *Image Generation*: Generates images via `image_generate` (mapping aspect ratios to landscape, portrait, or square), downloads results locally, and inserts Markdown image links.

## See also

[[MOC Skills]] · [[Zoth OS]]