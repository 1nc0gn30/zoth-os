---
title: "saelens"
tags: [skill, hermes]
aliases: ["saelens"]
---

# saelens

Workflows and tooling for training, evaluating, and analyzing Sparse Autoencoders (SAEs) with `sae-lens` and `transformer-lens`. It decomposes dense, polysemantic neural network activations into sparse, monosemantic, interpretable features to resolve neural superposition.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/saelens/SKILL.md`

### When to Load
- Decomposing internal transformer activations into interpretable feature representations.
- Analyzing mechanistic interpretability, concept discovery, and feature geometry across language model layers.
- Executing feature-based model steering or ablation by intervening on residual stream vectors during generation.
- Conducting safety evaluations to locate representations tied to deception, harmful content, or bias.
- Training custom SAE architectures (Standard ReLU with L1 penalty, Gated, TopK, or JumpReLU).

### Core Workflows & Metrics
- **Pretrained Analysis:** Load pre-trained SAE weights (`SAE.from_pretrained`), hook into `HookedTransformer` activation caches, and calculate top-activating features per token.
- **Feature Attribution & Steering:** Project feature activations through decoder weights (`W_dec`) and unembedding matrices (`W_U`) to attribute logit contributions, or add scaled feature directions during forward passes.
- **Training Pipeline:** Configure `LanguageModelSAERunnerConfig` with modular SAE sub-configs, monitoring L0 sparsity (active features per token), cross-entropy (CE) loss recovery percentage, and dead feature ratios.

## See also

[[MOC Skills]] · [[Zoth OS]]