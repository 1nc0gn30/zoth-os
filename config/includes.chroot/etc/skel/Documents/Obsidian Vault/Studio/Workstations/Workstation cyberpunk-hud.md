---
title: "Cyberpunk Telemetry HUD Cockpit"
tags: [studio, workstation]
aliases: ["cyberpunk-hud"]
---

# Cyberpunk Telemetry HUD Cockpit

Hybrid cybernetic telemetry HUD aggregating live loopback host sensors, core daemons, and 88-port p50/p95 RTT packet streams on `:3000` alongside a 100% client-side Shannon entropy analyzer, FIPS 180-4 SHA-256 frame receipts, and honest browser offline telemetry fallback.

## Specification & Taxonomy

- **ID:** `cyberpunk-hud`
- **Name:** Cyberpunk Telemetry HUD Cockpit
- **Version:** `2.3.0`
- **Type:** `cockpit` (Multi-pane developer IDE and visual operational cockpit for human-agent engineering)
- **Execution Mode:** `hybrid` (live loopback telemetry via `:3000` + offline browser Shannon entropy inspector)
- **Band:** Swarm & Consensus
- **Canonical Route:** `/workstations/cyberpunk-hud` (also accessible at `/tools/cyberpunk-hud`)
- **Loopback Telemetry API:** `GET` / `HEAD` `http://127.0.0.1:3000/api/studio/cyberpunk-hud` (protected by loopback `Host` header `403` guard)

## Operational Profile

Registered in the Zoth Studio v2 matrix under the **Swarm & Consensus** functional band as a studio telemetry cockpit (`src/components/tools/CyberpunkHudGodModeTool.jsx` backed by pure zero-dependency `src/utils/cyberpunkHudEngine.js` and its byte-identical server mirror `server/cyberpunk-hud-engine.mjs`).

- **Live Telemetry HUD:** Reads real host CPU %, loadavg, RAM, root disk, `/sys/class/thermal` zones, GPU telemetry, PipeWire audio, and core loopback daemons via `/api/studio/cyberpunk-hud`.
- **Entropy & Packet Stream:** Computes exact Shannon entropy ($H = -\sum p_i \log_2 p_i$ in bits/byte), top-12 byte histograms, and synchronous FIPS 180-4 SHA-256 frame receipts.
- **Loopback Fleet Matrix & Exports:** Tracks 88-port loopback `p50`/`p95`/`max` RTT latencies and exports home-path-redacted JSON, Markdown, and formula-neutralized CSV diagnostics.
- **ZothOS Desktop HUD Companions:** Alongside the Studio web workstation (`zoth open cyberpunk-hud`), ZothOS provides native desktop HUD overlays via `/usr/local/bin/zoth-agent-hud` (Tkinter tactical HUD) and `/usr/local/bin/zoth-hud` (Electron Apex HUD).

## See also

[[Zoth Studio]] · [[MOC Workstations]]
