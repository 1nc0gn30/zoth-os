---
title: "What is the exact mathematical formulation for the STDP synaptic weight decay?"
tags: [studio, faq]
---

# What is the exact mathematical formulation for the STDP synaptic weight decay?

**Category:** Memory & AI

Exponential time-constant formulation Δw = A₊ · e^(-Δt / τ₊) mathematically prunes noise and anchors long-term verified architectural context.

Spike-Timing-Dependent Plasticity (STDP) governs memory longevity based on relative impulse timing Δt = t_post - t_pre: • Long-Term Potentiation (LTP, causal firing Δt > 0): Δw = A₊ · e^(-Δt / τ₊) • Long-Term Depression (LTD, acausal firing Δt < 0): Δw = -A₋ · e^(Δt / τ₋) Baseline parameters are configured as A₊ = 0.05, A₋ = 0.025, and time constants τ₊ = τ₋ = 20ms. Inactive memory nodes undergo continuous background exponential decay: w(t) = w₀ · e^(-λ · Δt) with decay constant λ = 0.0018 hr⁻¹, pruning stale noise while preserving actively verified architectural invariants.

## See also

[[Zoth Studio]] · [[MOC FAQs]]