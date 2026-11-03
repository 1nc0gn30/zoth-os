---
title: "modal"
tags: [skill, hermes]
aliases: ["modal"]
---

# modal

Serverless GPU cloud for ML jobs and model APIs.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/modal/SKILL.md`

## Overview & When to Load

Load when authoring, deploying, or debugging serverless ML pipelines on the Modal GPU cloud platform. Ideal for:
- Deploying auto-scaling inference endpoints and web services without managing servers.
- Running GPU-accelerated batch jobs, distributed training, or parallel data processing.
- Setting up scheduled jobs with scale-to-zero economics.

## Core Concepts & Capabilities

- **Compute & GPUs:** On-demand access to GPUs (T4, L4, A10G, L40S, A100-40/80GB, H100, H200, B200) configured directly in Python via `@app.function(gpu="...")` with fallback and multi-GPU support.
- **Primitives:**
  - `App`: Central container for cloud functions and declared infrastructure.
  - `Image`: Python/Debian container definitions with `pip_install` or CUDA base layers.
  - `Cls`: Class-based services with `@modal.enter()` hooks for single-instance model loading.
  - `Volume`: Persistent shared network storage for weights and datasets.
  - `Secret`: Encrypted environment variables and provider tokens.
- **Web Endpoints:** Exposes functions via `@modal.fastapi_endpoint`, `@modal.asgi_app`, or `@modal.web_server`, supporting dynamic batching with `@modal.batched`.
- **Autoscaling (Modal 1.0):** Leverages `scaledown_window` (idle timeout), `max_containers`, `min_containers` (warm pools), and `@modal.concurrent` for request concurrency.
- **Execution Modes:** `modal run` for one-off jobs, `modal serve` for hot-reloading local development, and `modal deploy` for permanent cloud hosting.

## See also

[[MOC Skills]] · [[Zoth OS]]