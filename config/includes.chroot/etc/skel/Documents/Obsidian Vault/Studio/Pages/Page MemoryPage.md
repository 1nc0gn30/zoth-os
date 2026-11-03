---
title: "MemoryPage"
tags: [studio, page]
---

# MemoryPage

`MemoryPage` is the interactive synaptic memory and neuromorphic Netrunner workbench mounted at route `/memory/docs` in Zoth Studio v2.

## What it renders

- **Daemon Status & Local Runtime Strip**: Monitors connection health to the local Neuro Memory Daemon running on loopback port `:8094` (`useStudioStatus`).
- **Four Core Cognitive Workbenches**:
  1. *Whitespace Cyberspace*: A serene 3D neural constellation visualizer powered by `Netrunner3DWorld`, plotting memory nodes in spatial 3D coordinates based on zero-egress pseudo-embeddings (`computePseudoEmbedding`).
  2. *STDP Plasticity Lab*: Interactive Spike-Timing-Dependent Plasticity simulation testing synaptic potentiation ($A_+$) and depression ($A_-$) rates, time constants ($\tau_+$, $\tau_-$), and exponential decay curves.
  3. *Stratum Database*: Searchable, filterable tabular memory catalog displaying memory IDs, cluster classifications, author badges (Lucy, Azoth, Athena, Lycan, Onyx), synaptic weights, 3D vectors $(x, y, z)$, and semantic tags.
  4. *Lucy Codec & Voice Console*: In-browser cybernetic communication terminal rendering transmission dialogues, audio carrier wave generator controls, and memory query injection.
- **Memory Ingestion Modal**: Allows operators to inject new memory records, deterministically calculating local pseudo-embeddings and initial STDP weights without cloud API calls.
- **Sovereign Funnel**: Integrates `SovereignFunnel` providing repository clone commands for the standalone local Neuro Memory Daemon.

- **Source:** `zoth-studio-v2/src/pages/MemoryPage.jsx`
- **Route:** `/memory/docs`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route memory-docs|/memory/docs]] · [[Route memory|/memory]] · [[MCP memory|memory]] · [[Page MemoryShowcasePage|Memory Showcase Page]]