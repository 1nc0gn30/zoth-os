---
title: "Zoth Mission Control & Fleet Dispatcher"
tags: [studio, workstation]
aliases: ["mission-control"]
---

# Zoth Mission Control & Fleet Dispatcher

The **Zoth Mission Control & Fleet Dispatcher** (`v2.5.0`) is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js` & `public/api/workstations.json`) under Studio Cockpits & Developer IDEs.

### Core Functionality
Hybrid local-first fleet supervisor unifying live 91-port loopback telemetry (`/api/studio/fleet`), core daemon & KVM status (`/api/studio/status`), read-only Hermes Agent Gateway & WebChat observability (`/api/studio/hermes/status`), Konsole Relay posture (`/api/studio/konsole-relay`), deterministic Kahn Mission DAG wave scheduling & cycle detection, PBFT quorum verification (`N >= 3f + 1`, `Q = 2f + 1`), incident triage, and formula-safe JSON/Markdown/CSV/YAML exports with synchronous FIPS 180-4 SHA-256 receipts and honest `BROWSER_OFFLINE_FALLBACK`.

### Workstation Metadata
- **ID:** `mission-control`
- **Name:** Zoth Mission Control & Fleet Dispatcher
- **Version:** `2.5.0`
- **Type:** `cockpit` (multi-pane operator cockpit for fleet supervision and Mission DAG dispatch)
- **Execution Type:** `hybrid` (in-browser deterministic engine + optional loopback `:3000` read-only telemetry)
- **Functional Band:** Swarm & Consensus
- **Canonical Route:** `/workstations/mission-control` (alias `/tools/mission-control`)
- **CLI Entrypoint:** `zoth open mission-control` (`zoth open mission-control --json`)
- **Loopback Studio APIs:** `GET`/`HEAD /api/studio/mission-control`, `POST /api/studio/mission-control/plan` (strict loopback `Host`/`Origin` `403`, `64 KB` body cap `413`, `~/` path & secret redaction)
- **Pure Engine Parity:** `src/utils/missionControlEngine.js` == `server/mission-control-engine.mjs` (`npm run test:mission-control`)

### Operational Role
Operates within the Swarm & Consensus band as the read-only fleet management console and deterministic Mission DAG runbook planner. Companion multi-agent Pantheon Swarm Multiplexer (`:8141`) documentation lives at [[Route swarm|/swarm]] and [[Route swarm-docs|/swarm/docs]].

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Route workstations-workstationId|/workstations/mission-control]] · [[Route swarm|/swarm]]
