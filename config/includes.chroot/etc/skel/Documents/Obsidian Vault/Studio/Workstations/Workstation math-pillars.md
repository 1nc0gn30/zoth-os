---
title: "Six Mathematical Pillars Academy"
tags: [studio, workstation]
aliases: ["math-pillars"]
---

# Six Mathematical Pillars Academy

The **Six Mathematical Pillars Academy** (`v2.3.0`) is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) under the Observe band.

### Core Functionality
Deterministic browser and loopback solver workstation covering all Six Mathematical Pillars plus Byzantine BFT Quorum bounds:
1. **Pillar I — Linear Algebra**: Arbitrary-dimension dot product, L2 norms, cosine similarity, scaled dot-product attention `softmax(Q·Kᵀ/√d_k)·V`, and KV-cache memory estimator `M_KV = 2·L·H·d_h·S·bytes`.
2. **Pillar II — Multivariable Calculus**: Multi-step decoupled AdamW trajectory, L2 gradient norm clipping, and LoRA rank budgets `r·(d_in + d_out)`.
3. **Pillar III — Probability & Information Theory**: Log-sum-exp softmax, top-p nucleus cutoff, Shannon entropy `H(X)`, perplexity `2^H`, and KL divergence `D_KL(P ‖ Q)`.
4. **Pillar IV — Hessian & Loss Manifolds**: Analytic 2×2 symmetric Hessian eigenvalues, condition number `κ(H)`, definiteness classification, and matrix-free finite-difference HVP.
5. **Pillar V — Lyapunov & Phase Dynamics**: Clamped exponential divergence `exp(clamp(λ·t, -50, 50))`, dual-trajectory OLS exponent estimation, and coherence index `C = exp(-H/H_max)`.
6. **Pillar VI — Neuromorphic STDP**: Exact causal LTP / anti-causal LTD with neutral `Δw(0) = 0`, full `[-80, +80] ms` curve, and bounded `[0, 1]` synapse trace.
7. **Byzantine BFT Quorum**: Exact `N >= 3f + 1`, quorum `Q = 2f + 1`, and `f_max = floor((N - 1) / 3)` verifier.

### Workstation Metadata
- **ID:** `math-pillars`
- **Name:** Six Mathematical Pillars Academy
- **Version:** `2.3.0`
- **Execution Type:** `hybrid` (100% deterministic in-browser engine mirrored at loopback `:3000`)
- **Functional Band:** Observe
- **Canonical Route:** `/workstations/math-pillars` (alias `/tools/math-pillars`)
- **Theory Academy Route:** `/docs/math` & `/docs/math/:pillarId`
- **Loopback API:** `GET`/`HEAD /api/studio/math-pillars`, `POST /api/studio/math-pillars/evaluate`
- **CLI Command:** `zoth open math-pillars` (`npm run test:math-pillars`)

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Page MathPillarsPage|MathPillarsPage]] · [[Page MathPillarDetailPage|MathPillarDetailPage]]
