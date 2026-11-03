---
title: "SwarmDaemonMultiplexer"
tags: [studio, component]
---

# SwarmDaemonMultiplexer

The `SwarmDaemonMultiplexer` component (`zoth-studio-v2/src/components/SwarmDaemonMultiplexer.jsx`) is a 21-terminal command multiplexer and monitoring cockpit for the Pantheon agent swarm.

## What It Renders

- **Multiplexer Controls & Broadcast Bar:**
  - **Broadcast Input:** Input field to execute commands across all visible terminals concurrently, with quick command presets (`zoth status --air-gap`, `git status -s`, `stdp memory sync`, etc.).
  - **View Mode Switcher:** Toggles between `matrix` (full 21-terminal grid), `cadre` (filter by Architects, Code, Security, Creative, or Swarm), and `spotlight` (deep dive into a single agent).
  - **Cadre Filtering Tabs:** Filter terminals by cadre with real-time agent count badges.
- **Per-Agent Interactive Terminals:**
  - **Agent Header:** Avatar, agent name, cadre badge, PID, runtime status (`IDLE` / `RUNNING`), STDP memory score, and synaptic connection count.
  - **Harness & Model Selectors:** Dropdowns to re-route harnesses (Hermes Agent, Agy, Codex, Claude Code, OpenCode, Ollama, etc.) and model weights (Claude 3.7, DeepSeek R1, Qwen 2.5, etc.).
  - **Terminal Console:** Monospace log console displaying system notices, agent reasoning steps, execution outputs, and working directories (`pwd`).
  - **Terminal Controls:** Command prompt, run button, copy log buffer, clear terminal, and spotlight expansion.

## Parent & Integration

Rendered directly inside [[Page SwarmPage|SwarmPage]] (`/swarm`) as a dedicated cockpit, and mounted globally as a lazy-loaded overlay in [[Component Navbar|Navbar]] triggered via `Ctrl+~`.

## See also

[[Zoth Studio]] · [[MOC Components]]