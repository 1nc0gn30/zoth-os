---
title: "peft"
tags: [skill, hermes]
aliases: ["peft"]
---

# Parameter-Efficient Fine-Tuning (PEFT)

A workstation skill from Hermes for fine-tuning large language models on limited GPU memory by training under 1% of parameters using LoRA, QLoRA, and adapter architectures.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/mlops/peft/SKILL.md`

## When to load
Load this skill when an agent or developer needs memory-efficient LLM adaptation:
- Fine-tuning 7B–70B parameter models on consumer or single-workstation GPUs (e.g., RTX 4090, A100).
- Training modular, lightweight task adapters (e.g., 6MB adapter files rather than full multi-gigabyte models).
- Utilizing QLoRA (4-bit NF4 quantization via `bitsandbytes`) to fit 70B models into 24GB VRAM.
- Serving and switching multiple task-specific adapters dynamically from a shared base model.
- Merging trained adapters back into base models for zero-overhead inference.

## Key capabilities & techniques
- **Adapter configurations:** Configures rank (`r`), scaling factor (`lora_alpha`), dropout, and layer targets (such as attention projections or `all-linear`).
- **Quantized training (QLoRA):** Pairs `BitsAndBytesConfig` (4-bit NF4 double quantization) with gradient checkpointing via `prepare_model_for_kbit_training`.
- **PEFT methods supported:** LoRA, QLoRA, AdaLoRA, IA3 (0.01% trainable parameters), Prefix Tuning, and Prompt Tuning.
- **Serving & runtime switching:** Supports `model.set_adapter()` to toggle between tasks on a single loaded base model, and `merge_and_unload()` for deployment.
- **Ecosystem integrations:** Seamless workflows with Hugging Face `transformers`, TRL (`SFTTrainer`), Axolotl YAML configurations, and vLLM multi-LoRA serving.

## See also

[[MOC Skills]] · [[Zoth OS]]