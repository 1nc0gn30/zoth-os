---
title: "agent-budget-sentinel.service"
tags: [os, systemd]
---
# agent-budget-sentinel.service

ZothOS Agent Budget Sentinel - Autonomous Token Cost Circuit Breaker & Guardrail

- **Unit:** `agent-budget-sentinel.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/bin/python3 ~/NullAITech/agent-budget-sentinel/bin/agent-budget serve --web-port 8110 --proxy-port 8111`

- **Description:** ZothOS Agent Budget Sentinel - Autonomous Token Cost Circuit Breaker & Guardrail
- **ExecStart:** `/usr/bin/python3 ~/NullAITech/agent-budget-sentinel/bin/agent-budget serve --web-port 8110 --proxy-port 8111`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-budget-sentinel|Agent Budget Sentinel]] · [[Workstation agent-budget-sentinel|Agent Budget Sentinel // Token Cost Circuit Breaker]] · [[Daemon budget_sentinel|agent-budget-sentinel]]