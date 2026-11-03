---
title: "evaluating-llms-harness"
tags: [skill, hermes]
aliases: ["evaluating-llms-harness"]
---

# evaluating-llms-harness

Standardized LLM evaluation harness (`lm-eval`) for benchmarking language models across 60+ academic benchmarks using reproducible prompts and metrics.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/evaluation/evaluating-llms-harness/SKILL.md`
- **Dependencies:** `lm-eval`, `transformers`, `vllm`
- **Tags:** Evaluation, LM Evaluation Harness, Benchmarking, MMLU, HumanEval, GSM8K, EleutherAI, Model Quality

## When to Load

Load when benchmarking model quality, comparing open-source checkpoints, reporting academic benchmark metrics (MMLU, GSM8K, HumanEval, TruthfulQA, HellaSwag), tracking checkpoint quality across training steps, or testing models via Hugging Face, vLLM, or APIs.

## Key Capabilities & Workflows

- **Core Reasoning Suites:** Evaluates MMLU (57 subjects), GSM8K (grade-school math), HellaSwag (commonsense), and ARC (AI2 reasoning challenge).
- **Code Generation:** Benchmarks HumanEval and MBPP with mandatory `--confirm_run_unsafe_code` execution flags.
- **High-Throughput Inference:** Supports the `vllm` backend with tensor parallelism for 5–10× faster benchmark runs compared to standard Hugging Face execution.
- **Training Progression:** Automates intermediate 0-shot evaluation during training loops (GSM8K/HellaSwag) to plot learning curves without stalling on heavy suites.

## See also

[[MOC Skills]] · [[Zoth OS]]