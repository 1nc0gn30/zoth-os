---
title: "tensorrt-llm"
tags: [skill, hermes]
aliases: ["tensorrt-llm"]
---

# tensorrt-llm

High-throughput, low-latency LLM inference optimization and serving on NVIDIA GPUs.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/tensorrt-llm/SKILL.md`
- **Dependencies:** `tensorrt-llm`, `torch` (Linux, NVIDIA GPUs)

## Overview & When to Load

Load this skill when deploying or optimizing LLM inference workloads on NVIDIA GPUs (e.g., A100, H100, GB200):
- Implementing maximum-throughput generation and low-latency production serving.
- Deploying quantized models using FP8, INT4, or FP4 precisions.
- Scaling inference across multiple GPUs or multi-node clusters using tensor parallelism (TP), pipeline parallelism (PP), or expert parallelism for MoE architectures.
- Configuring advanced inference features such as in-flight batching, paged KV cache, speculative decoding, and disaggregated prefill/generation.

## Key Interfaces

- **Python API:** `from tensorrt_llm import LLM, SamplingParams` for direct programmatic generation and batch inference.
- **Serving Engine:** `trtllm-serve` for production OpenAI-compatible HTTP serving (`/v1/chat/completions`) with automatic model compilation and multi-GPU tensor parallelism.

## See also

[[MOC Skills]] · [[Zoth OS]]