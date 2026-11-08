---
title: "MOC · Conductor & Sovereign Loopback Daemons"
date: 2026-11-06
author: "Neal Frazier (@1nc0gn30)"
status: verified
tags:
  - moc
  - os
  - daemon
cluster: OS
stdp_weight: 0.98
---

# 📡 MOC · Conductor & Sovereign Loopback Daemons

Loopback daemons registered in `conductor.py`, `zoth-arsenal-daemons.service`, and active Ring-0 sovereign system services.

> [!tip] Interactive Bases Database
> Query live fleet status, ports, and health formulas in [[Zoth Fleet & Daemons.base]] and [[Zoth Ecosystem & Public Surfaces.base]].

## 1. Ring-0 & Flagship Sovereign Fleet Daemons

| Daemon / Service | Vault Note | Loopback Port | Public Surface / Role |
| :--- | :--- | :--- | :--- |
| **`zoth-studio-v2`** | [[Daemon zoth_studio\|zoth-studio-v2]] · [[Zoth Studio]] | `:3000` | [zoth.nullai.tech](https://zoth.nullai.tech) — 72-Tool Cockpit, 8-Planet 3D World, Adytum 22 |
| **`neuro-memory-daemon`** | [[Daemon neuro_memory\|neuro-memory-daemon]] · [[Zoth Memory]] | `:8094` | [neuro-memory.nullai.tech](https://neuro-memory.nullai.tech) — 41,690+ STDP Engrams & 21-Tool MCP |
| **`zoth-civilization`** | [[Daemon civilization\|zoth-civilization]] · [[Zoth Civilization & Pantheon 21]] | `:8120` / `:9393` / `:8088` | [zoth.nullai.tech/world](https://zoth.nullai.tech/world) — Pantheon 21 & [[World of Zoth]] |
| **`vaelor-daemon`** | [[Daemon vaelor\|vaelor-daemon]] · [[Vaelor Network]] | `:8140` | Feeless Account-Lattice L1 DAG, 5/5 BFT Quorum & PoUW |
| **`zothos-lite`** | [[ZothOS-Lite Web Desktop]] | `:8145` | [zothos.nullai.tech](https://zothos.nullai.tech) — A100 3D Web Desktop & Window Manager |
| **`zoth-obsidian-tracker`** | [[Studio/Verification/Arsenal Verification & Test Tracker]] | `:8151` | Obsidian Second Brain & 72-Tool Verification Dashboard |
| **`zothnet`** | [[ZothNet Sovereign Mesh]] | `:9900` (HTTP) / `:42069` (UDP) | [zothnet.nullai.tech](https://zothnet.nullai.tech) — Sphinx 1,280B Mixnet, Vaelor PoR & ZML Studio |
| **`zoth-cursorz`** | [[1nc0gn30 Sovereign Hub]] | `:9990` | 16 Concurrent Virtual Agent Cursors, 3D Braille Trails & CV Trainer |
| **`bolt-diy` / `zoth-webgen`** | [[Daemon bolt_diy\|bolt-diy]] · [[Zoth WebGen]] | `:5173` | Full-Stack AI Web App Foundry |

---

## 2. Conductor & Security / Commerce Sub-Daemons

- [[Daemon neuro_memory|neuro-memory-daemon]] (`:8094`)
- [[Daemon vaelor|vaelor-daemon]] (`:8140`)
- [[Daemon zoth_studio|zoth-studio-v2]] (`:3000`)
- [[Daemon bolt_diy|bolt-diy]] (`:5173`)
- [[Daemon civilization|zoth-civilization]] (`:8120` / `:9393`)
- [[ZothNet Sovereign Mesh|zothnet-daemon]] (`:9900` / `:42069`)
- [[ZothOS-Lite Web Desktop|zothos-lite-daemon]] (`:8145`)
- [[Daemon egress_sentinel|agent-egress-sentinel]]
- [[Daemon mock_twin|agent-mock-twin]]
- [[Daemon prompt_firewall|agent-prompt-firewall]]
- [[Daemon kokoro_voice|kokoro-voice-runtime]]
- [[Daemon flight_recorder|agent-flight-recorder]]
- [[Daemon capsule_jail|agent-capsule-jail]]
- [[Daemon policy_auditor|agent-policy-auditor]]
- [[Daemon etsy_pod_forge|etsy-pod-forge]]
- [[Daemon etsy_connector|etsy-connector]]
- [[Daemon mcp_lens|mcp-lens]]
- [[Daemon budget_sentinel|agent-budget-sentinel]]
- [[Daemon gods_eye|agent-gods-eye]]
- [[Daemon shopify_connector|shopify-connector]]
- [[Daemon voice_call|agent-voice-call]]
- [[Daemon printify_connector|printify-connector]]
- [[Daemon gelato_connector|gelato-connector]]
- [[Daemon pod_smart_router|pod-smart-router]]
- [[Daemon digital_asset_forge|digital-asset-forge]]
- [[Daemon pod_mockup_forge|pod-mockup-forge]]
- [[Daemon pod_margin_sentinel|pod-margin-sentinel]]
- [[Daemon producthunt_connector|producthunt-connector]]

## See also

[[00 Home]] · [[Zoth OS]] · [[Zoth Fleet & Daemons.base]] · [[Zoth Ecosystem & Public Surfaces.base]] · [[Vaelor & Sovereign Economy.canvas]]
