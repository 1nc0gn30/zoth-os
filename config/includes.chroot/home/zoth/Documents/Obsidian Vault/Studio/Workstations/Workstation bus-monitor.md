---
title: "Zoth Swarm NOC & Signal Bridge"
tags: [studio, workstation]
aliases: ["bus-monitor"]
---

# Zoth Swarm NOC & Signal Bridge

The **Zoth Swarm NOC & Signal Bridge** is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) under Hardware Enclave Daemons.

### Core Functionality
Decentralized agent bus monitor with E2EE WebSocket loopback pinger and NOC telemetry.

### Workstation Metadata
- **ID:** `bus-monitor`
- **Name:** Zoth Swarm NOC & Signal Bridge
- **Type:** `enclave_daemon` (core hardware-anchored zero-egress daemon running on local loopback)
- **Functional Band:** Swarm & Consensus
- **Static Entrypoint:** `/studio/bus-monitor.html`
- **In-App Route:** `/bridges`

### Operational Role
Operates within the Swarm & Consensus band as a network operations center (NOC) cockpit, monitoring decentralized agent message bus activity, executing end-to-end encrypted loopback ping diagnostics, and gathering real-time telemetry across agent signals.

## See also

[[Zoth Studio]] · [[MOC Workstations]]