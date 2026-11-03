---
title: "weights-and-biases"
tags: [skill, hermes]
aliases: ["weights-and-biases"]
---

# weights-and-biases

> **Workstation Skill (Hermes)** — Origin: Hermes skill (workstation skill, not a Zoth product).

A comprehensive MLOps workstation skill for experiment tracking, hyperparameter optimization, model registry management, and real-time visualization using **Weights & Biases** (`wandb`).

### Core Capabilities
- **Experiment Tracking:** Automatically records metrics, hyperparameters, system utilization (CPU/GPU), and console output with live dashboard visualization.
- **Hyperparameter Sweeps:** Executes automated hyperparameter searches using Bayesian optimization, random search, or grid search strategies.
- **Artifact Management:** Tracks datasets, checkpoints, and model weights with immutable versioning and end-to-end lineage graphs.
- **Model Registry:** Organizes production models, versions, and stage transitions (e.g., staging vs. production).
- **Framework Integrations:** Native support for PyTorch, PyTorch Lightning, HuggingFace Transformers, and Keras/TensorFlow.
- **Offline Resilience:** Supports disconnected environments via `WANDB_MODE=offline` for later synchronization (`wandb sync`).

### When to Load
- Integrating experiment logging into machine learning training scripts.
- Configuring hyperparameter sweep agents and parameter spaces.
- Logging or retrieving versioned datasets and model checkpoints via W&B Artifacts.

- **Author / License:** Orchestra Research · MIT License
- **Platforms:** Linux, macOS, Windows
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/evaluation/weights-and-biases/SKILL.md`

## See also

[[MOC Skills]] · [[Zoth OS]]