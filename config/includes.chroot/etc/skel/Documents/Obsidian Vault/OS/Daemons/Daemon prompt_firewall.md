---
title: "agent-prompt-firewall"
tags: [os, daemon]
aliases: ["prompt_firewall", "agent-prompt-firewall"]
port: 8098
subsystem: "Security & Firewall"
status: "standby"
health_url: "http://127.0.0.1:8098/api/stats"
repo: "~/NullAITech/agent-prompt-firewall"
---

# agent-prompt-firewall

Prompt Injection Defense & PII Redactor

- **Name:** `agent-prompt-firewall`
- **Ports:** 8098, 8099
- **Health:** `http://127.0.0.1:8098/api/stats`
- **Stats:** `http://127.0.0.1:8098/api/stats`
- **Repo:** `~/NullAITech/agent-prompt-firewall`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-prompt-firewall|Agent Prompt Firewall]] · [[Workstation agent-prompt-firewall|Agent Prompt Firewall // Inline Defense & Radar]] · [[Unit agent-prompt-firewall.service|agent-prompt-firewall.service]]