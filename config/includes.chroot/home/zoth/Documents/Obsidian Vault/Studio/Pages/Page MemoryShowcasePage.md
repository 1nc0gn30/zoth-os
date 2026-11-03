---
title: "MemoryShowcasePage"
tags: [studio, page]
---

# MemoryShowcasePage

`MemoryShowcasePage` renders the high-level product showcase and introduction page for the synaptic memory system mounted at route `/memory` in Zoth Studio v2.

## What it renders

- **Hero Banner**: Features an illuminated purple `GlowLine` and headline (*"Memory That Evolves"*), introducing the brain-inspired memory architecture designed to retain persistent agent context across sessions.
- **Core Value Propositions Grid**: 4-column card layout detailing key memory pillars:
  - *Brain-Inspired Memory* (`PsychologyIcon`): Neuron-modeled memory persistence.
  - *Learns Over Time* (`TrendingUpIcon`): Synaptic reinforcement with usage and natural fading of idle data.
  - *Semantic Search* (`SearchIcon`): Finding context by conceptual meaning rather than keyword matching.
  - *Local-First Privacy* (`StorageIcon`): Zero-cloud vector storage strictly under local operator control.
- **Target Audience Section**: Outlines user personas, including AI researchers exploring memory architectures and developers building context-aware autonomous agents.
- **Call-to-Action Controls**:
  - Direct router navigation button to the full Netrunner memory workbench and docs at `/memory/docs`.
  - External link to GitHub repository `NullAITech/vector-search-engine`.

- **Source:** `zoth-studio-v2/src/pages/MemoryShowcasePage.jsx`
- **Route:** `/memory`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route memory|/memory]] · [[Page MemoryPage|Memory Documentation Page]]