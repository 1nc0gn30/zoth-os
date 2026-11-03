---
title: "agent-capsule-jail"
tags: [os, daemon]
aliases: ["capsule_jail", "agent-capsule-jail"]
port: 8105
subsystem: "Security & Firewall"
status: "standby"
health_url: "http://127.0.0.1:8105/api/health"
repo: "~/NullAITech/agent-capsule-jail"
---

# agent-capsule-jail

Kernel Enclave Sandbox & Ephemeral Execution

- **Name:** `agent-capsule-jail`
- **Ports:** 8105
- **Health:** `http://127.0.0.1:8105/api/health`
- **Stats:** `http://127.0.0.1:8105/api/stats`
- **Repo:** `~/NullAITech/agent-capsule-jail`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-capsule-jail|Agent Capsule Jail]] · [[Workstation agent-capsule-jail|Agent Capsule Jail // Kernel Sandbox & Isolation]] · [[Unit agent-capsule-jail.service|agent-capsule-jail.service]]