---
title: "agent-prompt-firewall.service"
tags: [os, systemd]
---
# agent-prompt-firewall.service

ZothOS Agent Prompt Firewall & Security Radar

- **Unit:** `agent-prompt-firewall.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_prompt_firewall.cli serve --web-port 8098 --proxy-port 8099`

- **Description:** ZothOS Agent Prompt Firewall & Security Radar
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_prompt_firewall.cli serve --web-port 8098 --proxy-port 8099`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-prompt-firewall|Agent Prompt Firewall]] · [[Workstation agent-prompt-firewall|Agent Prompt Firewall // Inline Defense & Radar]] · [[Daemon prompt_firewall|agent-prompt-firewall]]