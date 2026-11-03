---
title: "pytorch-fsdp"
tags: [skill, hermes]
aliases: ["pytorch-fsdp"]
---

# pytorch-fsdp

Fully sharded data-parallel training documentation and code patterns for large-scale PyTorch and Hugging Face Transformers models.

- **Origin:** Hermes skill (`optional-skills/mlops/pytorch-fsdp`)
- **Author:** Orchestra Research
- **Dependencies:** `torch>=2.0`, `transformers`
- **Platforms:** Linux, macOS
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Designing or implementing distributed training pipelines with PyTorch Fully Sharded Data Parallel (FSDP / FSDP2).
- Querying PyTorch FSDP API syntax, wrapping policies, and sharding strategies.
- Configuring mixed precision policies (bf16/fp16 compute with fp32 reduction).
- Implementing activation checkpointing or CPU parameter/gradient offloading.
- Debugging memory pressure (OOMs), rank communication hangs, or state dict serialization.

## Key Capabilities & Reference Architecture
- **Common Patterns Library:** Includes comprehensive reference templates in `references/common-patterns.md` covering model wrapping, auto-wrap policies (e.g., transformer block units), and optimizer sharding.
- **Sharding Strategies:** Guidance for selecting between `FULL_SHARD` (Zero-3), `SHARD_GRAD_OP` (Zero-2), `NO_SHARD` (DDP equivalent), and `HYBRID_SHARD`.
- **Checkpointing:** State-dict saving and distributed checkpointing schemes (sharded vs. full state dicts).
- **FSDP2:** Modern per-module sharding and composable distributed APIs introduced in PyTorch 2.x.

## See also

[[MOC Skills]] · [[Zoth OS]]