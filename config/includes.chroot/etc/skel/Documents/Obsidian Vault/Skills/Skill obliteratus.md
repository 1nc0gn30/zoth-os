---
title: "obliteratus"
tags: [skill, hermes]
aliases: ["obliteratus"]
---

# obliteratus

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/obliteratus/SKILL.md`
- **Category:** MLOps / Mechanistic Interpretability / Model Surgery
- **Platforms:** Linux, macOS

## Overview

The `obliteratus` workstation skill covers surgical removal of refusal behaviors (guardrails) from open-weight LLMs without retraining or fine-tuning. It applies mechanistic interpretability techniques—including difference-in-means, multi-direction SVD, whitened SVD, LEACE linear concept erasure, and attention head surgery—to project out refusal directions while preserving language fluency and reasoning capabilities.

## When to Load

Load this skill when:
- Abliterating refusal guardrails from open-weight models (such as Llama, Mistral, Qwen, or Gemma).
- Investigating refusal circuitry via mechanistic interpretability analysis modules (e.g. logit lens, alignment imprint fingerprinting, causal tracing).
- Evaluating hardware VRAM constraints across compute tiers (from CPU/tiny models to 70B+ with 4-bit quantization).
- Running ablation tournaments or benchmarking post-modification refusal rates against perplexity degradation.

## Key Methods & Workflows

- **CLI-Only Invocation:** Operated strictly via external CLI commands (`obliteratus obliterate <model> --method advanced`) to maintain license boundaries (tool is AGPL-3.0).
- **Primary Methods:** Supports 9 CLI methods including `advanced` (default; multi-direction SVD with norm-preserving projection), `basic` (fast diff-in-means), `surgical` (tailored for reasoning models and CoT preservation), `nuclear` (for MoE architectures), and `optimized` (Bayesian hyperparameter tuning).
- **Quality Verification:** Benchmarks outputs against target thresholds: refusal rate (<5%), perplexity growth (<10%), and low KL divergence before saving standard Hugging Face weight directories.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill serving-llms-vllm|serving-llms-vllm]] · [[Skill llama-cpp|llama-cpp]] · [[Skill huggingface-tokenizers|huggingface-tokenizers]]