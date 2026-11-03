---
title: "SwarmPage"
tags: [studio, page]
---

# SwarmPage

React documentation and cockpit page for the **Pantheon Multi-Agent Swarm Hub** in Zoth Studio.

- **File:** `zoth-studio-v2/src/pages/SwarmPage.jsx`
- **Route:** [[Route swarm-docs|/swarm/docs]]

## What It Renders

`SwarmPage` provides real-time telemetry, testing harnesses, and process coordination controls for the 21 sovereign Pantheon agent nodes distributed across 5 operational cadres (Architects, Code, Security, Creative, Swarm).

Key components and interfaces rendered:
- **Header & Telemetry Badges:** Air-gapped architecture badges, loopback status indicator, and SHA-256 heartbeat monitor.
- **View Mode Switcher:** Toggles between interactive Journey walkthrough (`SwarmFrameJourney`), Live Cockpit, and `SovereignFunnel`.
- **Daemon Multiplexer:** Checks local daemon status via `http://127.0.0.1:8989` and `/api/studio/swarm/status` (`SwarmDaemonMultiplexer`).
- **Canvas Visualizer:** Interactive 2D canvas network graph displaying live node links and cadre topologies (`SwarmCanvasVisualizer`).
- **Task Dispatcher:** Interactive job submission and execution console (`SwarmTaskDispatcher`).
- **Cadre Latency Tester:** Live ping latency measurement across cadre endpoints with timestamped event logs.
- **Agent Roster:** Expandable directory of Pantheon agents filterable by cadre.

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route swarm-docs|/swarm/docs]] · [[Route swarm|/swarm]]