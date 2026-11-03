---
title: "zoth-swarm-quorum"
tags: [os, cli]
aliases: ["zoth-swarm-quorum"]
---

# zoth-swarm-quorum

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-swarm-quorum` is the command-line companion to [[Studio zoth-swarm-multiplexer|21-Agent Swarm Multiplexer]], [[Studio zoth-civilization|Zoth Civilization Hub]], and [[Component SwarmCivilizationGodModeTool|SwarmCivilizationGodModeTool]]. It evaluates the Byzantine Fault Tolerance ($3f+1$) quorum state and computes Merkle epoch roots for the 21-Agent Pantheon across ZothOS v3.2.

## Usage & Options

```bash
zoth-swarm-quorum [-h] [--faults FAULTS] [--json]
```

- **`--faults FAULTS`**: Number of simulated Byzantine fault nodes $f$ ($0 \dots 10$, default: 0). Quorum is satisfied when $f \le 6$.
- **`--json`**: Output quorum telemetry, Merkle epoch root, and ring rosters as structured JSON.

## The 21-Agent Pantheon Roster

- **Inner Ring I (Archons)**: `AZOTH`, `HERMES`, `ATHENA`, `APOLLO`, `ARES`, `HEPHAESTUS`, `THOTH`
- **Middle Ring II (Strategists)**: `CHRONOS`, `ORION`, `NYX`, `IRIS`, `PROMETHEUS`, `NEMESIS`, `JANUS`
- **Outer Ring III (Artisans)**: `DAEDALUS`, `ARGUS`, `VULCAN`, `ECHO`, `MORPHEUS`, `HELIOS`, `AETHER`

## Implementation Details

- **Path**: `/usr/local/bin/zoth-swarm-quorum` (symlinked from `~/.local/bin/zoth-swarm-quorum`)
- **Runtime**: `/usr/bin/env python3`
- **Zero External Dependencies**: Pure Python standard library implementation (`hashlib`, `json`, `argparse`)
- **Cryptographic Verification**: Computes deterministic SHA-256 Merkle epoch roots mapping consensus rounds directly to the live OS agent bus

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio zoth-swarm-multiplexer|21-Agent Swarm Multiplexer]] · [[Studio zoth-civilization|Zoth Civilization Hub]] · [[Component SwarmCivilizationGodModeTool|SwarmCivilizationGodModeTool]]
