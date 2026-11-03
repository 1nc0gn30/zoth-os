---
title: "serving-llms-vllm"
tags: [skill, hermes]
aliases: ["serving-llms-vllm"]
---

# serving-llms-vllm

**serving-llms-vllm** is an optional Hermes workstation skill providing guidance and operational workflows for high-throughput LLM serving via vLLM.

- **Origin:** Hermes skill (`/home/zoth/.hermes/hermes-agent/optional-skills/mlops/inference/serving-llms-vllm/SKILL.md`)
- **Category:** Workstation skill (Hermes MLOps/Inference), not a Zoth product.
- **Dependencies:** `vllm`, `torch`, `transformers`

### When to Load
Load this skill when:
- Deploying production-grade LLM APIs or OpenAI-compatible local endpoints (`vllm serve`).
- Optimizing inference latency and throughput for multi-user workloads.
- Serving large models within constrained GPU memory using quantization (AWQ, GPTQ, FP8) or tensor parallelism.
- Executing high-volume offline batch inference pipelines.

### Core Capabilities & Workflows
- **PagedAttention & Continuous Batching:** Manages KV cache memory in blocks to achieve high throughput without memory fragmentation.
- **Production Server Deployment:** Serving models with custom GPU memory utilization, prefix caching, chunked prefill, and tensor parallel sizing across GPUs.
- **Metrics & Observability:** Exposes Prometheus metrics on `/metrics` (tracking TTFT, running requests, and GPU cache usage percentage).
- **Offline Batch Processing:** Direct Python LLM generation pipelines with structured JSONL output handling.
- **Quantization Optimization:** Running models like 70B variants within reduced VRAM footprints.

## See also

[[MOC Skills]] · [[Zoth OS]]