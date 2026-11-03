---
title: "nemo-curator"
tags: [skill, hermes]
aliases: ["nemo-curator"]
---

# nemo-curator

Curate LLM training data: dedupe, filter, PII redaction.

- **Origin:** Hermes skill (workstation skill, not a Zoth product; NVIDIA)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/nemo-curator/SKILL.md`

## Overview & When to Load

Load when designing GPU-accelerated data curation pipelines to prepare high-quality pretraining or fine-tuning datasets for LLMs and multimodal models.

## Core Capabilities & Architecture

- **Architecture (1.x):** Uses a Ray-based `Pipeline` and modular `ProcessingStage` architecture with resource declarations (CPU, GPU memory, replicas) executed via engines like `XennaExecutor`.
- **Text Curation Stages:**
  - *Quality Filtering:* Evaluates text heuristics (word counts, line repetitions, URL ratios, symbol distributions) and deploys classifier models (e.g., DeBERTa quality classifier).
  - *Deduplication:* Executes exact ID/text matching, MinHash + LSH fuzzy deduplication (benchmarked at 16× faster on GPUs versus CPU clusters), and dense embedding-based semantic deduplication.
  - *PII Redaction:* Detects and anonymizes or strips sensitive personal data (names, emails, phone numbers, locations).
- **Multimodal Support:**
  - *Images:* Aesthetic scoring filters, NSFW detection classifiers, and CLIP embedding generation.
  - *Video:* PySceneDetect scene splitting, duration filtering, and video representation embeddings.
  - *Audio:* ASR transcription validation with Word Error Rate (WER) scoring and duration windowing.
- **Scale & Performance:** Integrates with Dask CUDA and Ray clusters to stream Parquet, JSONL, and TAR WebDatasets with linear multi-GPU scaling.

## See also

[[MOC Skills]] · [[Zoth OS]]