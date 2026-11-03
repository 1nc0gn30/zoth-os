---
title: "torchtitan"
tags: [skill, hermes]
aliases: ["torchtitan"]
---

# torchtitan

Large-scale distributed LLM pretraining using PyTorch-native composable 4D parallelism.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/torchtitan/SKILL.md`
- **Dependencies:** `torch>=2.6.0`, `torchtitan>=0.2.0`, `torchao>=0.5.0`

## Overview & When to Load

Load this skill when setting up, configuring, or scaling distributed foundation model pretraining:
- Training LLMs (such as Llama 3 / 3.1 architectures) from scratch at scale.
- Configuring 4D parallelism topologies:
  - **FSDP2:** Fully Sharded Data Parallel for memory-efficient parameter sharding.
  - **TP (Tensor Parallelism):** Intra-node tensor sharding across GPU ranks.
  - **PP (Pipeline Parallelism):** Layer partitioning across multiple nodes.
  - **CP (Context Parallelism):** Sequence length scaling for ultra-long context windows.
- Enabling Float8 mixed precision training with `torchao` for substantial throughput gains on NVIDIA H100 hardware.
- Orchestrating single-node multi-GPU runs via `torchrun` or multi-node cluster training via SLURM job scripts.

## Operational Workflow

- Training runs are launched with `torchrun -m torchtitan.train` or `./run_train.sh` referencing registered module configurations (e.g., `MODULE=llama3 CONFIG=llama3_8b`).
- Hyperparameters and parallelism degrees can be customized directly in the Python config registry or overridden via CLI flags.

## See also

[[MOC Skills]] · [[Zoth OS]]