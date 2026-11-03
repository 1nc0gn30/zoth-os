---
title: "trl-fine-tuning"
tags: [skill, hermes]
aliases: ["trl-fine-tuning"]
---

# trl-fine-tuning

Post-training instruction tuning and reinforcement learning alignment for LLMs using HuggingFace TRL.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/training/trl-fine-tuning/SKILL.md`
- **Dependencies:** `trl`, `transformers`, `datasets`, `peft`, `accelerate`, `torch`

## Overview & When to Load

Load this skill when executing post-training pipelines, instruction tuning, or preference alignment on language models:
- **Supervised Fine-Tuning (SFT):** Instruction-tuning base models on prompt-completion datasets using `SFTTrainer` and `SFTConfig`.
- **Direct Preference Optimization (DPO):** Aligning model outputs directly against chosen/rejected pairs without training a separate reward model using `DPOTrainer`.
- **Online Reinforcement Learning:**
  - **RLOO (REINFORCE Leave-One-Out):** Reward-model-driven online RL via `RLOOTrainer` / `trl rloo` (replacing deprecated PPO in TRL 1.x).
  - **GRPO (Group Relative Policy Optimization):** Memory-efficient group-relative RL via `GRPOTrainer` / `trl grpo` for reasoning models.
- **Reward Modeling:** Training sequence classification scoring models via `RewardTrainer` to evaluate model outputs.

## Common Interfaces

- High-level Python training APIs (`SFTTrainer`, `DPOTrainer`, `RewardTrainer`, `RLOOTrainer`, `GRPOTrainer`).
- Fast CLI tools for distributed multi-GPU training (`trl sft`, `trl dpo`, `trl rloo`, `trl grpo`).

## See also

[[MOC Skills]] · [[Zoth OS]]