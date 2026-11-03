---
title: "brag-slim"
tags: [skill, hermes]
aliases: ["brag-slim"]
---

# brag-slim

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/brag-slim/SKILL.md`

## Overview
`brag-slim` is a lightweight, lean launch video generation skill written for Claude Opus 5.5. Unlike the full `brag` workflow, it operates without Hyperframes or bundled assets, having the model synthesize the complete video directly using existing local tools.

## When to Load
Load this skill when:
- Creating a launch video from a local codebase/project directory or a live website URL.
- Reusing real source UI, fonts, and assets rather than redrawing or mocking them.
- Generating automated video assets, plans, and promotional copy without external heavy video dependencies.

## Key Features & Workflow
- **Lean Generation**: Builds story, visuals, music, sound effects, audio mix, and final rendering directly via local utilities.
- **Source Reuse**: Inspects the target project directory or website to capture genuine user interfaces, styling, and typography.
- **Outputs**: Writes to `brag-output/` containing the production plan, rendered video, and share copy.
- **Configuration Options**: Accepts `--tone`, `--format landscape|vertical|square`, and `--duration`.
- **Prerequisites**: Requires FFmpeg (for audio mixing and video encoding) and a headless browser engine (Node with Playwright/Puppeteer, or Chrome) for JavaScript rendering and frame capture.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill brag|brag]] · [[Skill hyperframes|hyperframes]]