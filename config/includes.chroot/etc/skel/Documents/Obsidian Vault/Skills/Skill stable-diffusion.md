---
title: "stable-diffusion"
tags: [skill, hermes]
aliases: ["stable-diffusion"]
---

# stable-diffusion

Text-to-image generation, inpainting, and image-to-image translation workflows using the HuggingFace Diffusers library.

- **Origin:** Hermes optional workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/stable-diffusion/SKILL.md`
- **Dependencies:** `diffusers>=0.30.0`, `transformers>=4.41.0`, `accelerate>=0.31.0`, `torch>=2.0.0`

## When to Load
Load this skill when building local image generation pipelines, converting text prompts into images, performing image-to-image style transfers, filling masked regions (inpainting), or configuring diffusion architectures (SD 1.5, SDXL, SD 3.0, and Flux).

## Key Capabilities & Techniques
- **Pipelines:** Implements `AutoPipelineForText2Image`, `AutoPipelineForImage2Image`, and `AutoPipelineForInpainting`.
- **Spatial Control:** Integrates ControlNet conditioning (Canny edge detection, OpenPose skeletons, depth maps, line drawings).
- **Style Adapters:** Supports loading, fusing, and weighting single or multiple LoRA weights (`pipe.load_lora_weights()`, `pipe.fuse_lora()`).
- **Scheduler Selection:** Documents denoising trade-offs across Euler, DPM-Solver Multistep, DDIM, UniPC, and LCM schedulers.
- **Memory Optimization:** Covers low-VRAM configurations including model CPU offloading (`pipe.enable_model_cpu_offload()`), attention slicing, xFormers attention, and VAE slicing/tiling for high-resolution images.

## See also

[[MOC Skills]] · [[Zoth OS]]