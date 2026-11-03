---
title: "WorkstationsPage"
tags: [studio, page]
---

# WorkstationsPage

React directory and constellation hub for **Sovereign Workstation Enclaves**.

- **File:** `zoth-studio-v2/src/pages/WorkstationsPage.jsx`
- **Route:** [[Route workstations|/workstations]]

## What It Renders

`WorkstationsPage` organizes all Studio workstations into six functional operational bands: **Build**, **Observe**, **Security**, **Spatial**, **Studio**, and **Swarm & Consensus**.

Key elements and functionality rendered:
- **Hero & System Badges:** Header highlighting zero-cloud air-gap guarantees, loopback execution, and active enclave counts.
- **Band Architecture:** Color-coded band configurations with thematic icons and descriptions:
  - *Build:* Autonomous compilation pipelines, code foundries, sandboxes.
  - *Observe:* Telemetry arrays, chronicles, and theory academy.
  - *Swarm & Consensus:* Byzantine AST synthesis, signal bridges, radars.
  - *Security:* Shannon entropy monitors, threat simulation, air-gapped bridges.
  - *Spatial:* Nexus 3D viewports and visual linkage engines.
  - *Studio:* Netrunner memory hubs, design tokens, and alchemical seals.
- **Interactive SVG Constellation Graph:** Topological network visualization connecting the operational bands.
- **Filter & Search Controls:** Full-text search and band-filtering toggle group.
- **Workstation Grid Cards:** Displays workstation title, band tag, description, quick copy command (`zoth open <id>`), and launch link to `/tools/:toolId`.
- **Sovereign Funnel:** Bottom deployment module (`SovereignFunnel`).

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route workstations|/workstations]] · [[Page WorkstationDetailPage|WorkstationDetailPage]]