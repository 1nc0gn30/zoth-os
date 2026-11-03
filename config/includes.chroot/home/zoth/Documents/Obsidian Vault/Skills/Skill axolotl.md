---
title: "axolotl"
tags: [skill, hermes]
aliases: ["axolotl"]
---

# axolotl

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/training/axolotl/SKILL.md`

## Overview
The `axolotl` skill provides operational guidance for fine-tuning Large Language Models using Axolotl. It covers YAML-based configuration, distributed training strategies, parameter-efficient adapters, and alignment methods.

## When to Load
Load this skill when:
- Configuring and running LLM fine-tuning runs using YAML configuration files.
- Implementing parameter-efficient fine-tuning with LoRA or QLoRA across supported open architectures.
- Setting up preference alignment workflows such as DPO, KTO, ORPO, or GRPO.
- Debugging distributed training setups involving FSDP, DeepSpeed, sequence parallelism, or context parallelism.
- Optimizing model checkpoints with compressed saving (`save_compressed: true`) for vLLM inference.

## Key Capabilities & Patterns
- **Training Configurations**: Streamlined YAML setup defining dataset paths, model architectures, tokenizer rules, and hyperparameters.
- **Distributed Scaling**: Configures Fully Sharded Data Parallel (FSDP v2), NCCL performance testing, and context parallelism across multi-GPU nodes.
- **Data Handling**: Manages prompt templates, tokenization strategies, and sequence length filtering (`drop_long_seq`).
- **Cloud & Orchestration**: Patterns for orchestrating training runs on Modal cloud environments and tracking metrics via `AxolotlTrainer`.

## See also

[[MOC Skills]] · [[Zoth OS]]