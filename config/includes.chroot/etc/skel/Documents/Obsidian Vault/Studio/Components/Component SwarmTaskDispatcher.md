---
title: "SwarmTaskDispatcher"
tags: [studio, component]
---

# SwarmTaskDispatcher

- **File:** `zoth-studio-v2/src/components/SwarmTaskDispatcher.jsx`
- **Parent / Route:** [[Page SwarmPage]] (`/swarm`)

## Overview

`SwarmTaskDispatcher` renders an interactive task execution panel titled "Interactive 21 Pantheon Agent Task Dispatcher", allowing operators to simulate zero-telemetry multi-agent work orders across local IPC channels.

## What It Renders

- **Task Prompt Input:** A full-width text field pre-filled with a default prompt (`Build high-throughput E2EE WebSocket proxy with biomorphic memory recall`).
- **Dispatch Action:** A button displaying execution state (`Dispatch Swarm`, `Executing...`, `Completed!`) accompanied by an animated progress bar (`LinearProgress`).
- **Pipeline Step Cards:** Five sequential execution phases mapped to specific Pantheon agents:
  - `AZOTH`: Decomposing tasks into parallel micro-work orders.
  - `MERCURY`: Dispatching work orders to 21 Pantheon subagent nodes.
  - `NEURO-MEM`: Querying local HNSW vector index and STDP memory graph.
  - `HEXSTRIKE`: Auditing payload entropy and validating OWASP zero-egress security.
  - `VIGIL / CONSENSUS`: Synthesizing tri-agent Socratic debate and generating a SHA-256 seal.
- **Status Indicators:** Step-by-step progress cards updating through `WAITING`, `⚡ RUNNING`, and `✔ DONE` status chips.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page SwarmPage]]