---
title: "slime"
tags: [skill, hermes]
aliases: ["slime"]
---

# slime

Workstation skill from Hermes (not a Zoth product). LLM post-training framework from Tsinghua THUDM / Orchestra Research.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/slime/SKILL.md`

## Overview

Connects Megatron-LM for distributed model training (TP, PP, DP, SP) with SGLang for high-throughput rollout generation and reward verification. Powers models such as GLM-4.x, Qwen3, DeepSeek V3/R1, and Llama 3.

## When to Load

- Implementing RL post-training algorithms (GRPO, GSPO, PPO, REINFORCE++).
- Configuring Megatron-LM distributed training pipelines with SGLang inference routers.
- Setting up asynchronous training loops to overlap rollout generation and weight updates.
- Training multi-turn reasoning agents that execute tools and collect environment feedback.

## Key Components

- **Training Engine:** Megatron-LM managing actor training and optional critic networks with gradient checkpointing and sequence parallelism.
- **Rollout Engine:** SGLang-based high-throughput rollout router with GPU co-location support (`--colocate`).
- **Data Buffer:** Flexible sample buffering for off-policy reuse, prompt stratification, and multi-task evaluation (e.g. GSM8K, AIME).

## See also

[[MOC Skills]] · [[Zoth OS]]