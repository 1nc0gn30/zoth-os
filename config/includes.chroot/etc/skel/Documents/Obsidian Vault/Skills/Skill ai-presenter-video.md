---
title: "ai-presenter-video"
tags: [skill, hermes]
aliases: ["ai-presenter-video"]
---

# AI Presenter Video

A workstation skill from Hermes (ported from lanshu-create-ai-presenter-video) for creating verified presenter-led videos from a script and a single authorized adult portrait.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/creative/ai-presenter-video/SKILL.md`

## When to load
Load this skill when producing, captioning, repairing lip-sync, or rendering complete presenter-led video projects:
- Initializing and tracking video jobs with structured state machines in `job.json`.
- Locking narration audio via TTS and verifying alignment against scripts using speech-to-text (ASR).
- Generating avatar video segments using image-to-video endpoints (such as FAL / Kling / Wan / MiniMax) with pilot-run validation.
- Composing timelines deterministically with ffmpeg filtergraphs or the `hyperframes` skill.
- Normalizing delivery loudness (-16 LUFS) and validating video encodes with contact sheet visual QA.

## Operating rules & safety gates
- **Consent and rights verification:** Explicit flags in `job.json` (`rights_confirmed`, `adult_presenter_confirmed`, `remote_upload_approved`, `voice_clone_approved`) must be validated by `preflight.py` before any remote generation.
- **Master audio clock:** The finalized, locked narration audio dictates all downstream video edits, scene boundaries, and caption timings.
- **Delivery finalization:** `finalize_delivery.sh` produces master and share encodes, verifies full decode integrity, logs report metrics, and generates a 9-frame contact sheet for visual sign-off.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hyperframes|hyperframes]] · [[Skill kanban-video-orchestrator|kanban-video-orchestrator]] · [[Skill comfyui|comfyui]]