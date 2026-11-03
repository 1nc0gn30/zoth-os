---
title: "agent-budget-sentinel"
tags: [os, daemon]
aliases: ["budget_sentinel", "agent-budget-sentinel"]
port: 8110
subsystem: "Agent Mesh"
status: "standby"
health_url: "http://127.0.0.1:8110/health"
repo: "/home/zoth/NullAITech/agent-budget-sentinel"
---

# agent-budget-sentinel

Token Cost Circuit Breaker & Spending Radar

- **Name:** `agent-budget-sentinel`
- **Ports:** 8110, 8111
- **Health:** `http://127.0.0.1:8110/health`
- **Stats:** `http://127.0.0.1:8110/api/stats`
- **Repo:** `/home/zoth/NullAITech/agent-budget-sentinel`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-budget-sentinel|Agent Budget Sentinel]] · [[Workstation agent-budget-sentinel|Agent Budget Sentinel // Token Cost Circuit Breaker]] · [[Unit agent-budget-sentinel.service|agent-budget-sentinel.service]]