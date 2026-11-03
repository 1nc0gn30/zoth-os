---
title: "heartmula"
tags: [skill, hermes]
aliases: ["heartmula"]
---

# heartmula

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/heartmula/SKILL.md`

## Overview
A workflow guide for HeartMuLa (`heartlib`), an open-source (Apache-2.0) foundation model family for Suno-like music and song generation directly from lyrics and musical tags. The family includes the HeartMuLa music language model (3B/7B), HeartCodec (12.5Hz audio reconstruction), HeartTranscriptor, and HeartCLAP.

## When to Load
- When generating full songs and music locally from text descriptions and structured lyrics (`[Intro]`, `[Verse]`, `[Chorus]`, etc.).
- When seeking a local, open-source alternative to proprietary music generators like Suno.
- When configuring or troubleshooting `heartlib` pipelines, dependency patches (RoPE cache / HeartCodec loading), and checkpoint downloads.

## Operational Requirements
- **Hardware:** Requires an NVIDIA GPU with CUDA support. Minimum 8GB VRAM using `--lazy_load true` (peaks at ~6.2GB for the 3B model); 16GB+ VRAM recommended. CPU execution is possible but extremely slow.
- **Output:** Produces 48kHz stereo MP3 audio (up to ~4 minutes per generation, with ~1.0 real-time factor).
- **Audio Precision:** HeartMuLa runs best in `bfloat16`, while HeartCodec requires `float32` to avoid audio degradation.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill audiocraft-audio-generation|audiocraft-audio-generation]] · [[Skill songwriting-and-ai-music|songwriting-and-ai-music]]