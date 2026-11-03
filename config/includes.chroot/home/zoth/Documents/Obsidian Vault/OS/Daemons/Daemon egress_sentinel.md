---
title: "agent-egress-sentinel"
tags: [os, daemon]
aliases: ["egress_sentinel", "agent-egress-sentinel"]
port: 8095
subsystem: "Security & Firewall"
status: "standby"
health_url: "http://127.0.0.1:8095/api/stats"
repo: "/home/zoth/NullAITech/agent-egress-sentinel"
---

# agent-egress-sentinel

Egress Radar & Proxy

- **Name:** `agent-egress-sentinel`
- **Ports:** 8095, 8096
- **Health:** `http://127.0.0.1:8095/api/stats`
- **Stats:** `http://127.0.0.1:8095/api/stats`
- **Repo:** `/home/zoth/NullAITech/agent-egress-sentinel`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-egress-sentinel|Agent Egress Sentinel]] · [[Workstation agent-egress-sentinel|Agent Egress Sentinel // Kinetic Network Radar]] · [[Unit agent-egress-sentinel.service|agent-egress-sentinel.service]]