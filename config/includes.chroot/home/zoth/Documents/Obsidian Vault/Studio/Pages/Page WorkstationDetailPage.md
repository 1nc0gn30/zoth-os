---
title: "WorkstationDetailPage"
tags: [studio, page]
---

# WorkstationDetailPage

React workstation execution console and detail workspace component.

- **File:** `zoth-studio-v2/src/pages/WorkstationDetailPage.jsx`
- **Route / Usage:** Detail workspace component for `/workstations/:workstationId` (redirected to `RealToolWorkspacePage` at `/tools/:toolId` in `App.jsx`).

## What It Renders

`WorkstationDetailPage` renders a standalone enclave cockpit tailored to individual sovereign workstation definitions from `workstations` (`zoth-studio-v2/src/data/workstations.js`).

Key sections and functionality rendered:
- **Header & Telemetry Bar:** Displays workstation category band, zero-egress air-gap verification badge, loopback port binding (:8094), and live telemetry metrics (IPC latency, throughput, TRNG entropy, packet counts).
- **CLI Command Chips:** Copy-to-clipboard action chips for `zoth open <id>` and `zoth run <id> --air-gap`.
- **Specialized Workstation Consoles:**
  - *AgentComposerWorkstation:* Multi-agent DAG pipeline topology builder and execution stepper.
  - *AxPowerhouseWorkstation:* Performance and accessibility audit dashboard.
  - *ToolBenchWorkstation:* Interactive developer tool runner.
  - *HubWorkstationConsole:* Integrated proxy hub for connected workstation endpoints.
  - *UniversalEnclaveConsole:* Fallback telemetry and air-gap interaction terminal.
- **Sovereign Funnel:** Bottom deployment card (`SovereignFunnel`) offering local CLI installation instructions.

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Page WorkstationsPage|WorkstationsPage]]