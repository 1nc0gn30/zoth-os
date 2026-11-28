---
title: "SwarmPage"
tags: [studio, page]
---

# SwarmPage

Technical protocol reference page for the **Pantheon Swarm Multiplexer (`127.0.0.1:8141`)** in Zoth Studio v2.

- **File:** `zoth-studio-v2/src/pages/SwarmPage.jsx`
- **Route:** [[Route swarm-docs|/swarm/docs]]
- **Companion Showcase:** [[Page SwarmShowcasePage]] (`[[Route swarm|/swarm]]`)
- **Live Fleet Supervisor:** [[Workstation mission-control]] (`/workstations/mission-control`)

## What It Renders

`SwarmPage` renders `TechnicalReferencePage` (emerald palette) documenting the local-first `NullAITech/zoth-swarm-multiplexer` daemon on `127.0.0.1:8141` (with legacy telemetry fallback reference `:8989`):

- **Clone & Local Boot Steps:** `git clone https://github.com/NullAITech/zoth-swarm-multiplexer.git`, `python3 server.py --port 8141`, and optional `1nc0gn30/zoth-egregore` setup.
- **CLI & Loopback Endpoints:** `zoth-swarm status --json`, `zoth-swarm dispatch --spec task.json`, `GET http://127.0.0.1:8141/health`, and `POST http://127.0.0.1:8141/api/dispatch`.
- **MCP Server Configuration:** Ready-to-copy JSON contract for `zoth-swarm` pointing to `/opt/zoth-swarm-multiplexer/swarm_cli.py --mcp` with `SWARM_HOST=127.0.0.1`, `SWARM_PORT=8141`, and `MEMORY_ENDPOINT=http://127.0.0.1:8094`.
- **Architecture Notes:** Git worktree isolation per worker cadre, automated unit-test and Gitleaks verifier gates, and Nous Research Hermes Agent / DeepSeek-Flash / Ollama pairing.

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route swarm-docs|/swarm/docs]] · [[Route swarm|/swarm]] · [[Workstation mission-control]]
