---
title: "simpo"
tags: [skill, hermes]
aliases: ["simpo"]
---

# simpo

**simpo** is an optional Hermes workstation skill that guides reference-free preference optimization (SimPO) for post-training LLM alignment.

- **Origin:** Hermes skill (`/home/zoth/.hermes/hermes-agent/optional-skills/mlops/simpo/SKILL.md`, Princeton NLP)
- **Category:** Workstation skill (Hermes MLOps / Alignment), not a Zoth product.
- **Dependencies:** `torch`, `transformers`, `datasets`, `trl`, `accelerate`.

### When to Load
Load this skill when:
- Aligning language models on chosen/rejected preference datasets without loading a second reference model into VRAM.
- Seeking a simpler, compute-efficient alternative to Direct Preference Optimization (DPO) or PPO.
- Training models on single-node GPU workstations with DeepSpeed ZeRO-3.

### Core Capabilities & Workflows
- **Reference-Free Optimization:** Aligns policy models directly against target margins, eliminating the baseline reference model requirement of standard DPO.
- **Training Configurations:** Provides launch recipes using `accelerate launch` with DeepSpeed ZeRO-3 and Flash Attention 2.
- **Hyperparameter Control:** Tunes `beta` (reward scaling 2.0–10.0), `gamma_beta_ratio` (target margin), `loss_type` (sigmoid/hinge), and optional SFT regularization weights (`sft_weight`) to preserve base reasoning capabilities.
- **Troubleshooting:** Addresses loss divergence (lowering learning rate/beta), capability forgetting, and GPU out-of-memory errors via gradient checkpointing.

## See also

[[MOC Skills]] · [[Zoth OS]]