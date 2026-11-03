---
title: "llama-cpp"
tags: [skill, hermes]
aliases: ["llama-cpp"]
---

# llama-cpp

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/inference/llama-cpp/SKILL.md`

## Overview
Provides guidelines and operational patterns for local GGUF model inference with `llama.cpp` and model discovery across the Hugging Face Hub.

## When to Load
- Running local models on CPU, Apple Silicon, CUDA, ROCm, or Intel GPUs.
- Discovering GGUF models on Hugging Face Hub using URL patterns and the Hub tree API.
- Reconstructing `llama-server` or `llama-cli` commands directly from Hub repositories.
- Selecting appropriate quantization variants (such as `Q4_K_M`, `Q5_K_M`, `Q6_K`, or `IQ` types) based on available RAM and VRAM.
- Parsing Hub file listings to distinguish quantized base model weights from `mmproj-*.gguf` multimodal projector files.
- Implementing local inference in Python via `llama-cpp-python` for completions, chat streaming, and embeddings.

## Core Capabilities
- Direct command-line launch from Hub repositories (`llama-cli -hf ...`, `llama-server -hf ...`).
- Local OpenAI-compatible HTTP chat completion endpoint.
- Python bindings supporting parameter offloading across GPU layers (`n_gpu_layers`).

## See also

[[MOC Skills]] · [[Zoth OS]]