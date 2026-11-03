---
title: "Zoth Mission Control & Fleet Dispatcher"
tags: [studio, workstation]
aliases: ["mission-control"]
---

# Zoth Mission Control & Fleet Dispatcher

The **Zoth Mission Control & Fleet Dispatcher** is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) under Studio Cockpits & Developer IDEs.

### Core Functionality
Fleet supervisor for tracking active subagents, heartbeat telemetry, and queue states.

### Workstation Metadata
- **ID:** `mission-control`
- **Name:** Zoth Mission Control & Fleet Dispatcher
- **Type:** `cockpit` (multi-pane developer IDE and visual operational cockpit for human-agent engineering)
- **Functional Band:** Swarm & Consensus
- **Static Entrypoint:** `/studio/mission-control.html`
- **In-App Route:** `/swarm`

### Operational Role
Operates within the Swarm & Consensus band as the fleet management console for autonomous agent deployments. It provides real-time supervisor telemetry, monitors subagent heartbeat pulses, inspects task queues, and visualizes multi-agent concurrency and load distribution.

## See also

[[Zoth Studio]] · [[MOC Workstations]]