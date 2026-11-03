---
title: "agent-policy-auditor.service"
tags: [os, systemd]
---
# agent-policy-auditor.service

ZothOS Agent Policy Auditor & Capability Leaser

- **Unit:** `agent-policy-auditor.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_policy_auditor.cli serve --host 127.0.0.1 --port 8106`

- **Description:** ZothOS Agent Policy Auditor & Capability Leaser
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_policy_auditor.cli serve --host 127.0.0.1 --port 8106`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-policy-auditor|Agent Policy Auditor]] · [[Workstation agent-policy-auditor|Agent Policy Auditor // Capability Leaser & Broker]] · [[Daemon policy_auditor|agent-policy-auditor]]