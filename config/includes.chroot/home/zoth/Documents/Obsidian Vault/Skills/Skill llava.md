---
title: "llava"
tags: [skill, hermes]
aliases: ["llava"]
---

# llava

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/llava/SKILL.md`

## Overview
Provides operational workflows and implementation patterns for LLaVA (Large Language and Vision Assistant), an open-source multimodal model for visual dialogue, captioning, and visual question answering (VQA).

## When to Load
- Building interactive vision-language dialogue systems and image chatbots.
- Executing visual question answering (VQA) over user-supplied images.
- Generating automated image captions, visual scene summaries, and document inspections.
- Running multi-turn conversational image dialogue with conversational templates.
- Launching local inference via CLI (`python -m llava.serve.cli`) or web UI (`python -m llava.serve.gradio_web_server`).
- Implementing 4-bit or 8-bit quantization (`load_4bit=True`) to reduce GPU VRAM overhead during inference.

## Core Capabilities
- Pretrained model loading with `load_pretrained_model` across 7B, 13B, and 34B parameter models.
- Image processing and tokenization via `process_images` and `tokenizer_image_token`.
- Multi-turn conversation tracking using `conv_templates["llava_v1"]`.

## See also

[[MOC Skills]] · [[Zoth OS]]