---
title: "SwarmCivilizationGodModeTool"
tags: [studio, component]
aliases: ["SwarmCivilizationGodModeTool"]
---

# SwarmCivilizationGodModeTool

The `SwarmCivilizationGodModeTool` component (`zoth-studio-v2/src/components/tools/SwarmCivilizationGodModeTool.jsx`) is the dedicated God-Mode consensus simulator and visual swarm orchestrator powering [[Studio zoth-swarm-multiplexer|21-Agent Swarm Multiplexer]] and [[Studio zoth-civilization|Zoth Civilization Hub]].

## What It Renders

- **60fps 21-Agent Pantheon Orbital Constellation**: Interactive HTML5 canvas rendering the 21 sovereign agents in dynamic orbital harmony across three concentric rings:
  - **Inner Ring I (Sovereign Archons)**: AZOTH, HERMES, ATHENA, APOLLO, ARES, HEPHAESTUS, THOTH
  - **Middle Ring II (Tactical Strategists)**: CHRONOS, ORION, NYX, IRIS, PROMETHEUS, NEMESIS, JANUS
  - **Outer Ring III (Forge Artisans)**: DAEDALUS, ARGUS, VULCAN, ECHO, MORPHEUS, HELIOS, AETHER
- **Byzantine Fault Tolerance ($3f + 1$) Quorum Simulator**: Real-time slider injecting simulated Byzantine fault nodes ($f = 0 \dots 10$). Verifies mathematical quorum threshold ($N \ge 3f + 1 \implies f \le 6$ for $N=21$) with instant `SEALED` vs `DEGRADED` status transitions.
- **Merkle Epoch Root Verification**: Computes deterministic SHA-256 state roots across honest and faulty node subsets for tamper-proof epoch synchronization.
- **Swarm Topology YAML Exporter**: Compiles active agent ring assignments, privilege boundaries, and transport endpoints into declarative `.yaml` manifests.

## Parent & Integration

Mounted at `/tools/zoth-swarm-multiplexer` and `/tools/zoth-civilization`, styled via `RealityContext` tokens, and paired with the [[CLI zoth-swarm-quorum|zoth-swarm-quorum]] command-line tool.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Studio zoth-swarm-multiplexer|21-Agent Swarm Multiplexer]] · [[Studio zoth-civilization|Zoth Civilization Hub]] · [[CLI zoth-swarm-quorum|zoth-swarm-quorum]]
