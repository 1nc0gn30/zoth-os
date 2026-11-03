---
title: "imagine"
tags: [skill, grok]
aliases: ["imagine"]
---

# imagine

Operational workflow and prompting guidance for Grok Build's visual generation tools (`image_gen`, `image_edit`, and `reference_to_video`).

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/imagine`)
- **When to load:** Tool-usage-driven; load whenever generating or editing an image or video is being considered or prepared.

## Core Directives

- **Code Over Generation for Precision:** Image models struggle with exact text, numbers, math, and diagrams. Construct structured charts, tables, and multi-panel layouts using code (HTML/CSS) rather than prompt-based generation.
- **Verification Loop:** Inspect rendered outputs for clipped labels, garbled numbers, or hallucinated text. Re-layout in code if discrete accuracy fails.
- **Reference-First for Real People:** Never use raw text prompts for named real people or groups. Ground identity via web search and supply verified reference photos via `image_edit`.
- **Consistency Across Shots:** Anchor recurring characters, objects, or locations to a canonical reference or sprite turnaround sheet. Derive subsequent views via `image_edit` or `reference_to_video` rather than fresh independent prompts.

## Tool Capabilities

- **`image_gen`:** Generates new images from natural prose prompts with explicit aspect ratios (`1:1`, `16:9`, `9:16`, `3:2`, `2:3`).
- **`image_edit`:** Restyles, recolors, or alters existing reference images while maintaining composition or subject likeness.
- **`reference_to_video`:** Generates 1–15 second video clips (default 6s) from up to 14 reference images, up to 3 preset voice IDs (`<AUDIO_0>`), pinned `first_frame`/`last_frame` anchors, and timed keyframes. Shots are sequenced and concatenated losslessly with FFmpeg.

## See also

[[MOC Skills]] · [[Zoth OS]]