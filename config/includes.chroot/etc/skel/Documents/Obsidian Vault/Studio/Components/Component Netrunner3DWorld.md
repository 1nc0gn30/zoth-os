---
title: "Netrunner3DWorld"
tags: [studio, component, retired]
---

# Netrunner3DWorld (Retired)

> **Status: Retired & Removed (`v2.4.0`).** `src/components/Netrunner3DWorld.jsx` (`3,192` lines, `0` active imports, containing 4 unguarded mutating `POST http://127.0.0.1:8094/api/{remember,consolidate}` calls and `Math.random()` loops) has been deleted from `zoth-studio-v2`.

## Replacement Component

All Lucy Netrunner Memory Hub workstation rendering now runs through **`src/components/tools/NetrunnerMemoryHubGodModeTool.jsx`** backed by the pure deterministic engine **`src/utils/netrunnerMemoryEngine.js`** (mirrored byte-identically at **`server/netrunner-memory-engine.mjs`**):

- **Canonical Routes:** `/workstations/netrunner-memory` and `/tools/netrunner-memory` (overview at `/memory`, technical reference at `/memory/docs`).
- **Dual-Theme 2D Synaptic Constellation & STDP Curves:** Pure MUI + SVG visualization supporting Editorial Ivory Light Mode and Obsidian Gold Dark Mode with `>= 4.5:1` WCAG AA contrast and zero dark canvas slabs.
- **Strictly Read-Only `:8094` Telemetry:** Connects exclusively via hardened `GET/HEAD /api/studio/netrunner-memory` and `POST /api/studio/netrunner-memory/evaluate` with zero writes to `127.0.0.1:8094` and zero external egress.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Workstation netrunner-memory]]
