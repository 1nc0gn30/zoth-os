---
title: "flash-attention"
tags: [skill, hermes]
aliases: ["flash-attention"]
---

# Flash Attention

A workstation skill from Hermes for accelerating long-sequence transformer training and inference through IO-aware tiling and memory-efficient attention algorithms.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/mlops/flash-attention/SKILL.md`

## When to load
Load this skill when working on deep learning models and PyTorch transformers needing attention layer optimization:
- Accelerating attention execution (2–4x speedup) on sequences longer than 512 tokens.
- Reducing GPU VRAM memory footprints (10–20x reduction) during training or generation.
- Configuring PyTorch native Scaled Dot-Product Attention (`F.scaled_dot_product_attention`) backends.
- Implementing advanced attention patterns such as Multi-Query Attention (MQA), Grouped-Query Attention (GQA), sliding window attention, or Hopper (H100) FP8 precision.

## Key capabilities & workflows
- **PyTorch native SDPA:** Activates hardware Flash Attention kernels via `torch.nn.attention.sdpa_kernel` and `SDPBackend.FLASH_ATTENTION` in PyTorch 2.2+.
- **`flash-attn` library integration:** Utilizes standalone CUDA kernels (`flash_attn_func`) with explicit layout transformations (`[batch, seq, heads, dim]`) and causal masking.
- **Performance benchmarking:** Profiles speedup against naive quadratic softmax attention using `torch.utils.benchmark.Timer`.
- **Numerical precision validation:** Verifies numeric deviation remains within acceptable float16/bfloat16 tolerances (<1e-3).

## See also

[[MOC Skills]] · [[Zoth OS]]