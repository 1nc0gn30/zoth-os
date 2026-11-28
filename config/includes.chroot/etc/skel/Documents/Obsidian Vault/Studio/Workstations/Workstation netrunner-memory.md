---
title: "Lucy Netrunner Memory Hub"
tags: [studio, workstation]
aliases: ["netrunner-memory", "Lucy Oracle Biomorphic Memory Hub"]
---

# Lucy Netrunner Memory Hub

The **Lucy Netrunner Memory Hub** (`v2.4.0`) is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js` and `public/api/workstations.json`) under the Studio band as a hybrid read-only loopback cortex workstation.

### Core Functionality
- **Strictly Read-Only `:8094` Telemetry Bridge**: Probed via `GET/HEAD /api/studio/netrunner-memory` (`Host`/`Origin` `403` guards, `~/` path & secret redaction, `<= 1400ms` timeouts) against standing `127.0.0.1:8094` (`/health`, `/api/stats`, `/api/memories?limit=24`, `/api/graph`) with zero write mutations.
- **Asymmetric Hebbian STDP & Neuromodulator Lab**: Deterministic `src/utils/netrunnerMemoryEngine.js` (mirrored byte-identically at `server/netrunner-memory-engine.mjs`) evaluating `Δw(Δt) = A+ exp(-Δt/τ+)` (`Δt > 0`), `-A- exp(Δt/τ-)` (`Δt < 0`), `Δw(0) = 0`, Ebbinghaus retention `R(t, S) = exp(-t / S)`, and 5 neuromodulator profiles (`balanced`, `dopamine`, `norepinephrine`, `acetylcholine`, `serotonin`).
- **Real Hybrid Recall & CA3/CA1 Multi-Hop Explorer**: Robertson-Sparck Jones BM25 + 96-dim hashed n-gram cosine similarity + temporal salience ranking, paired with dual-theme 2D SVG synaptic constellation rendering (`NetrunnerMemoryHubGodModeTool.jsx`), copy-only safe CLI playbooks, and formula-safe JSON/Markdown/CSV exports with FIPS 180-4 SHA-256 receipts.
- **Honest Offline Fallback**: Switches explicitly to `BROWSER_OFFLINE_FALLBACK` with a curated 12-engram / 22-synapse cortex corpus when `:3000` or `:8094` is offline.

### Workstation Metadata
- **ID:** `netrunner-memory`
- **Name:** Lucy Netrunner Memory Hub
- **Version:** `2.4.0`
- **Execution Type:** `hybrid`
- **Functional Band:** Studio
- **Canonical Route:** `/workstations/netrunner-memory` (alias `/tools/netrunner-memory`)
- **Overview & Docs Routes:** `/memory` and `/memory/docs`
- **CLI Entrypoint:** `zoth open netrunner-memory`
- **Loopback Studio APIs:** `GET/HEAD /api/studio/netrunner-memory`, `POST /api/studio/netrunner-memory/evaluate`
- **Standing Daemon Entrypoint:** `python3 -m neuro_memory_daemon.cli serve --port 8094` (`127.0.0.1:8094`, strictly read-only from Studio)
- **Attribution:** Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform

## See also

[[Zoth Studio]] · [[MOC Workstations]]
