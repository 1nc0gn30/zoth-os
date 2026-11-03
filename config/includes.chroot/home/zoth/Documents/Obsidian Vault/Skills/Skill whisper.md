---
title: "whisper"
tags: [skill, hermes]
aliases: ["whisper"]
---

# whisper

> **Workstation Skill (Hermes)** — Origin: Hermes skill (workstation skill, not a Zoth product).

An audio processing and speech-to-text workstation skill utilizing OpenAI's **Whisper** model for robust multilingual transcription and translation across 99 languages.

### Core Capabilities
- **Multilingual Transcription:** Converts speech to text across 99 languages with automatic language detection or explicit language targeting.
- **English Translation:** Directly translates foreign spoken audio into English text via the translation task mode (`task="translate"`).
- **Model Tiers:** Supports multiple architecture sizes from lightweight (`tiny`, `base`) to high-fidelity (`medium`, `large`, `turbo`).
- **Timestamping & Subtitles:** Extracts word-level or segment-level timestamps to generate subtitle files (.srt, .vtt) and JSON transcriptions.
- **Contextual Prompting:** Accepts initial prompts to disambiguate domain-specific jargon, technical terms, and proper nouns.
- **Acceleration & Streaming:** Leverages GPU acceleration via PyTorch/CUDA and supports optimized inference via `faster-whisper`.

### When to Load
- Transcribing podcasts, meetings, voice memos, or video soundtracks.
- Extracting audio from media files (paired with `ffmpeg`) for document pipelines and RAG ingestion.
- Generating synchronized subtitle tracks or translating foreign audio to English.

- **Author / License:** Orchestra Research · MIT License
- **Platforms:** Linux, macOS
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/whisper/SKILL.md`

## See also

[[MOC Skills]] · [[Zoth OS]]