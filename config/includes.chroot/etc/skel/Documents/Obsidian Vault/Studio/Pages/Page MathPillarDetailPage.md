---
title: "MathPillarDetailPage"
tags: [studio, page]
---

# MathPillarDetailPage

`MathPillarDetailPage` renders the deep-dive mathematical derivation, interactive simulator, and multi-language implementation page mounted at route `/docs/math/:pillarId` in Zoth Studio v2.

## What it renders

- **Pillar Header & Navigation**: Displays the pillar's Roman numeral badge, title, subtitle, previous/next pillar navigation controls, and a quick-switcher chip strip across all six mathematical pillars (Linear Algebra, Calculus, Probability, Graph Theory, Chaos Theory, and STDP Neuromorphic Plasticity).
- **Tiered Formulations**: 3-level breakdown tabs with LaTeX/text formula cards and copy support:
  1. *Beginner (Intuition)*: High-level conceptual explanation.
  2. *Intermediate (Closed-Form)*: Formal analytical formulations.
  3. *Advanced (Tensor Equation)*: Full dimensional tensor equations.
- **Interactive Mathematical Simulator**: Dynamic sliders (`param1`, `param2`) and reactive computation engines tailored to each pillar (e.g. 4K sequence KV-cache footprint for Linear Algebra, AdamW parameter step size for Calculus, Shannon entropy for Probability, or Lyapunov divergence for Chaos).
- **Multi-Language Implementation Code**: Side-by-side code blocks in **Python** (PyTorch/NumPy), **Rust** (SIMD/ndarray), and **TypeScript** (WASM/Float32Array) with copy-to-clipboard actions.
- **Sovereign Funnel**: Embeds `SovereignFunnel` for local git cloning and standalone enclave deployment.

- **Source:** `zoth-studio-v2/src/pages/MathPillarDetailPage.jsx`
- **Route:** `/docs/math/:pillarId`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route docs-math-pillarId|/docs/math/:pillarId]] · [[Page MathPillarsPage|Math Pillars Overview]]