---
title: "audiocraft-audio-generation"
tags: [skill, hermes]
aliases: ["audiocraft-audio-generation"]
---

# audiocraft-audio-generation

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/audiocraft-audio-generation/SKILL.md`

## Overview
The `audiocraft-audio-generation` skill guides the use of Meta's AudioCraft library for generating music, environmental audio, and sound effects from text prompts or audio conditioning.

## When to Load
Load this skill when:
- Generating instrumental tracks or background music from descriptive text prompts.
- Synthesizing sound effects, ambient environmental audio, or Foley using AudioGen.
- Conditioning music generation on reference melodies (chroma features) or reference styles.
- Compressing, tokenizing, or reconstructing waveforms with the EnCodec neural audio codec.
- Building Python pipelines or Gradio interfaces for audio generation workflows.

## Key Models & Capabilities
- **MusicGen**: Text-to-music models ranging from `small` (300M) to `large` (3.3B), with dedicated variants for stereo generation and melody conditioning.
- **AudioGen**: Text-to-sound effect model (`audiogen-medium`, 1.5B) for environmental and spot audio.
- **EnCodec**: Neural audio compression model producing discrete audio tokens decoded back into raw audio waveforms.
- **Controllable Generation**: Parameters include `duration`, sampling temperature, `top_k`, and classifier-free guidance (`cfg_coef`) for prompt adherence.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill heartmula|heartmula]] · [[Skill songwriting-and-ai-music|songwriting-and-ai-music]]