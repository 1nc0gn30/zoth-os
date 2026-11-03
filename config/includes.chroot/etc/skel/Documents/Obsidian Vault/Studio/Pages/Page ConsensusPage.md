---
title: "ConsensusPage"
tags: [studio, page]
---

# ConsensusPage

`ConsensusPage` is the Byzantine Consensus Battle Arena and multi-agent dialectic arbitration workbench in Zoth Studio, rendered at route `[[Route consensus|/consensus]]`.

## Rendered Capabilities

- **3-Agent Socratic Dialectic Arena**: Simulates multi-round technical debates between distinct agent personas:
  - *AZOTH (Proponent)*: Introduces architectural proposals and defensive mitigations.
  - *KAI (Skeptic)*: Identifies security vulnerabilities, race conditions, and deadlocks.
  - *DRACO (Arbitrator)*: Synthesizes arguments and computes formal Bayesian confidence ratings.
- **Architectural Scenario Presets**: Includes instant simulation environments:
  - *Byzantine AST Quorum Deadlock*: Evaluates 2/3 BFT supermajority verification and Lamport epoch clocks for AST mutations.
  - *Memory Plasticity Buffer Overflow*: Validates lock-free dual-tier circular ring buffers and SIMD-accelerated exponential decay.
  - *Air-Gapped Hardware Key Derivation*: Tests constant-time modular arithmetic and Ed25519 signing against side-channel analysis.
- **Custom Debate Simulator**: Allows operators to enter bespoke proposals and execute live multi-stage debates (Thesis, Hardening, and Arbitration).
- **Consensus Metrics & Export**: Displays Bayesian posterior confidence percentages, ratified system invariants, and copyable JSON audit verdicts.

- **Source File:** `zoth-studio-v2/src/pages/ConsensusPage.jsx`
- **Parent / Route:** Served at `/consensus` (companion workstation at `[[Workstation consensus|Byzantine Consensus Battle Arena]]`)

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route consensus|/consensus]] · [[Workstation consensus|Byzantine Consensus Battle Arena]]