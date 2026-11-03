---
title: "brag"
tags: [skill, hermes]
aliases: ["brag"]
---

# brag

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/brag/SKILL.md`

## Overview
`brag` produces high-impact 15–25 second project launch videos using Hyperframes, a bundled soundtrack and sound effects library, and beat-synced cue analysis.

## When to Load
Load this skill when:
- Creating a scripted, stylized launch video for a repository or product.
- Applying specific tone profiles (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`).
- Requiring coordinated background music, sound effects, or automated voice narration.

## Key Features & Workflow
- **Storyboarding & Direction**: Analyzes the project in the current working directory, commits to an angle/tone, and briefs Hyperframes.
- **Rendered Output**: Produces `brag-output/brag.mp4` alongside a best-frame poster image and ready-to-use share copy.
- **Audio Integration**: Ships bundled music and SFX tracks with precomputed beat cues, and analyzes custom audio using `scripts/analyze_music_cues.py`.
- **Command Options**: Supports `--tone`, `--format landscape|vertical|square`, `--duration`, `--title`, `--no-music`, `--no-sfx`, and `--voice` (Kokoro narration).
- **Opus 5.5 Behavior**: Hands off automatically to `brag-slim` on Claude Opus 5.5 unless invoked with `--full` or `--voice`.
- **Prerequisites**: Node.js 22+, FFmpeg on `PATH`, Hyperframes CLI (`npx hyperframes doctor`), and `uv`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill brag-slim|brag-slim]] · [[Skill hyperframes|hyperframes]]