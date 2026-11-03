---
title: "accelerate"
tags: [skill, hermes]
aliases: ["accelerate"]
---

# HuggingFace Accelerate

A workstation skill from Hermes for running PyTorch training across multiple GPUs, nodes, or mixed precision setups with minimal code modifications.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/accelerate/SKILL.md`

## When to load
Load this skill when an agent or developer is scaling PyTorch training workloads:
- Transitioning standard single-GPU training scripts to multi-GPU DDP, multi-node clusters, or Apple Silicon / TPU hardware.
- Configuring mixed precision training (`fp16`, `bf16`, or `fp8` via `Accelerator(mixed_precision=...)`).
- Integrating distributed memory optimization frameworks such as DeepSpeed ZeRO (stages 1, 2, or 3) and PyTorch FSDP (Fully Sharded Data Parallel).
- Managing automatic gradient accumulation (`accelerator.accumulate`) and checkpoint state across distributed processes.

## Key capabilities & workflows
- **Unified API:** Simplifies distributed setup down to 4 boilerplate additions: instantiating `Accelerator()`, wrapping objects via `accelerator.prepare(model, optimizer, dataloader)`, replacing `loss.backward()` with `accelerator.backward(loss)`, and omitting manual `.to('cuda')` device calls.
- **CLI configuration:** Uses `accelerate config` for interactive YAML profile generation and `accelerate launch train.py` for environment execution.
- **Plugin architecture:** Accepts `DeepSpeedPlugin` or `FullyShardedDataParallelPlugin` directly in Python code for fine-grained sharding and offload controls.

## See also

[[MOC Skills]] · [[Zoth OS]]