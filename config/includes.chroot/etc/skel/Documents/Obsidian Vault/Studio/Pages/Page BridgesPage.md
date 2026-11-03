---
title: "BridgesPage"
tags: [studio, page]
---

# BridgesPage

`BridgesPage` is the multi-agent IPC and interconnect topology visualizer in Zoth Studio, rendered at route `[[Route bridges|/bridges]]`.

## Rendered Capabilities

- **K4 Sovereign Mesh Topology**: Interactive SVG visualizer displaying a complete 4-node interconnect between AZOTH (Prime Core), ATHENA (Socratic Arbiter), LUCY (Synaptic Vector Stream), and LYCAN (Enclave Sentinel).
- **Bidirectional IPC Channels**: Details 6 dedicated communication lines (Consensus Bus, Enclave Ratchet, Synapse Pipe, Zero-Egress Gate, Adytum Direct, Vector Relay) mapped to local UNIX sockets and loopback ports (`8791`–`8794`).
- **Interactive Packet Dispatcher**: Dispatches test telemetry payloads across nodes with simulated transit latency and SHA-256 integrity digests:
  - `SWARM_HEARTBEAT`: Cadre status and mesh entropy broadcasts.
  - `STDP_SYNAPSE_SYNC`: Synaptic weight and STDP decay rate adjustments.
  - `BYZANTINE_VOTE_PROPOSAL`: Socratic consensus ballots for Byzantine quorum validation.
  - `ADYTUM_KEY_ROTATION`: Forward-secret enclave key ratcheting.
- **Animated Signal Trajectories**: Animates packet flow directly along SVG edge paths between source and destination nodes.
- **Live Transmission Stream**: Maintains a chronological log of transmitted IPC packets alongside loopback daemon health metrics.

- **Source File:** `zoth-studio-v2/src/pages/BridgesPage.jsx`
- **Parent / Route:** Served at `/bridges`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route bridges|/bridges]]