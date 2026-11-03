---
title: "Neuromorphic STDP"
tags: [studio, math]
---

# Neuromorphic STDP

Synaptic plasticity, memory traces, and causality

Studio route: `/docs/math/stdp`.

- **Numeral:** VI

**Beginner.** If a cause fires just before an effect, the synapse strengthens. If the order flips, it weakens. That is how the memory daemon keeps traces.

**Intermediate.** Δw = A₊ · exp(−Δt / τ₊) when Δt > 0; −A₋ · exp(Δt / τ₋) when Δt < 0

**Advanced.** Δw = { A₊ e^(−Δt/τ₊) if Δt > 0 (LTP); −A₋ e^(Δt/τ₋) if Δt < 0 (LTD) }

| Metric | Value |
|---|---|
| LTP window τ₊ | 16.8 ms |
| LTD window τ₋ | 33.7 ms |
| Memory potentiation Δw | +0.124 causal |

## See also

[[Zoth Studio]] · [[Route docs-math]] · [[MOC Math]]