---
title: "agent-policy-auditor"
tags: [os, daemon]
aliases: ["policy_auditor", "agent-policy-auditor"]
port: 8106
subsystem: "Security & Firewall"
status: "standby"
health_url: "http://127.0.0.1:8106/api/health"
repo: "/home/zoth/NullAITech/agent-policy-auditor"
---

# agent-policy-auditor

Capability Leaser & Policy Broker

- **Name:** `agent-policy-auditor`
- **Ports:** 8106
- **Health:** `http://127.0.0.1:8106/api/health`
- **Stats:** `http://127.0.0.1:8106/api/stats`
- **Repo:** `/home/zoth/NullAITech/agent-policy-auditor`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-policy-auditor|Agent Policy Auditor]] · [[Workstation agent-policy-auditor|Agent Policy Auditor // Capability Leaser & Broker]] · [[Unit agent-policy-auditor.service|agent-policy-auditor.service]]