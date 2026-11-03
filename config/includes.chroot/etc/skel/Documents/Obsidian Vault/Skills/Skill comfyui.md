---
title: "comfyui"
tags: [skill, hermes]
aliases: ["comfyui"]
---

# comfyui

**comfyui** is a Hermes workstation skill (not a Zoth product) providing two-layer automation for image, video, and audio generation using ComfyUI.

- **Origin:** Hermes skill
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/comfyui/SKILL.md`

### Core Capabilities

- **Two-Layer Architecture:** Combines official `comfy-cli` for environment lifecycle (install, launch, custom node and model downloads) with custom Python scripts for REST/WebSocket workflow execution.
- **Workflow Parameter Injection:** Extracts schemas (`scripts/extract_schema.py`) from API-format JSON workflows, checks dependencies (`scripts/check_deps.py`), and executes runs (`scripts/run_workflow.py`) with dynamic prompts, seeds, and image uploads.
- **Hardware Probing & Cloud Routing:** Evaluates GPU VRAM and system specs via `scripts/hardware_check.py` to guide users between local setups (NVIDIA CUDA, AMD ROCm, Apple Silicon MPS) and hosted Comfy Cloud via `COMFY_CLOUD_API_KEY`.
- **Batching & Monitoring:** Provides batch sweeps (`scripts/run_batch.py`) across randomized seeds and real-time execution progress tracking via WebSockets (`scripts/ws_monitor.py`).
- **Multi-Model Support:** Configured for Stable Diffusion 1.5/XL, Flux Dev, SD3, and video pipelines like AnimateDiff, Wan, and Hunyuan.

### When to Load

Load when generating images or video via ComfyUI workflows, automating diffusion parameter sweeps, inspecting workflow schemas, or orchestrating local/cloud ComfyUI daemon instances.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill stable-diffusion|stable-diffusion]]