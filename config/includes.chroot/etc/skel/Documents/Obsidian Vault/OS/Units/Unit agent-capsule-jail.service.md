---
title: "agent-capsule-jail.service"
tags: [os, systemd]
---
# agent-capsule-jail.service

ZothOS Agent Capsule Jail & Ephemeral Process Enclave

- **Unit:** `agent-capsule-jail.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_capsule_jail.cli serve --host 127.0.0.1 --port 8105`

- **Description:** ZothOS Agent Capsule Jail & Ephemeral Process Enclave
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_capsule_jail.cli serve --host 127.0.0.1 --port 8105`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-capsule-jail|Agent Capsule Jail]] · [[Workstation agent-capsule-jail|Agent Capsule Jail // Kernel Sandbox & Isolation]] · [[Daemon capsule_jail|agent-capsule-jail]]