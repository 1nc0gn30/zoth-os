---
title: "agent-mock-twin"
tags: [os, daemon]
aliases: ["mock_twin", "agent-mock-twin"]
port: 8097
subsystem: "Agent Mesh"
status: "standby"
health_url: "http://127.0.0.1:8097/api/health"
repo: "~/NullAITech/agent-mock-twin"
---

# agent-mock-twin

Offline Deterministic Mock Twin

- **Name:** `agent-mock-twin`
- **Ports:** 8097
- **Health:** `http://127.0.0.1:8097/api/health`
- **Stats:** `http://127.0.0.1:8097/api/stats`
- **Repo:** `~/NullAITech/agent-mock-twin`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-mock-twin|Agent Mock Twin]] · [[Workstation agent-mock-twin|Agent Mock Twin // Deterministic API Replay]] · [[CLI agent-mock-twin|agent-mock-twin]] · [[Unit agent-mock-twin.service|agent-mock-twin.service]]