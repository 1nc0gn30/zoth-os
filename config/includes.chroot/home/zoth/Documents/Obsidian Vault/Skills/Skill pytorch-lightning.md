---
title: "pytorch-lightning"
tags: [skill, hermes]
aliases: ["pytorch-lightning"]
---

# pytorch-lightning

High-level training framework that structures PyTorch code to eliminate training loop boilerplate and automate distributed scaling.

- **Origin:** Hermes skill (`optional-skills/mlops/pytorch-lightning`)
- **Author:** Orchestra Research
- **Dependencies:** `lightning`, `torch`, `transformers`
- **Platforms:** Linux, macOS, Windows
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Refactoring raw PyTorch models into standardized `LightningModule` implementations.
- Scaling models across multiple GPUs or nodes without manual process spawning or rank management.
- Configuring distributed strategies such as DDP, FSDP, or DeepSpeed via single-line flags.
- Adding modular training lifecycle callbacks (`ModelCheckpoint`, `EarlyStopping`, `LearningRateMonitor`).
- Configuring automated mixed-precision training (`precision='bf16'` or `'fp16'`) and gradient accumulation.

## Core Abstractions & Architecture
1. **`LightningModule`:** Separates research logic from engineering mechanics by encapsulating:
   - `training_step(batch, batch_idx)`: Compute and log training loss without manual `.to('cuda')`.
   - `validation_step` & `test_step`: Automated validation and evaluation loops with metric aggregation.
   - `configure_optimizers`: Optimizer and learning rate scheduler declarations.
2. **`L.Trainer`:** Automates execution across CPU, GPU, Apple Silicon MPS, or TPU:
   - Configures distributed execution strategies (`strategy='ddp'`, `'fsdp'`, `'deepspeed'`).
   - Manages gradient accumulation (`accumulate_grad_batches`) and mixed precision.
   - Handles automatic metric logging to TensorBoard and best-checkpoint persistence.

## See also

[[MOC Skills]] · [[Zoth OS]]