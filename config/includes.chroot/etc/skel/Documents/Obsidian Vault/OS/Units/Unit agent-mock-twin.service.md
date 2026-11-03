---
title: "agent-mock-twin.service"
tags: [os, systemd]
---
# agent-mock-twin.service

ZothOS Agent Mock Twin Autonomous Offline API Simulator

- **Unit:** `agent-mock-twin.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_mock_twin.cli serve --host 127.0.0.1 --port 8097`

- **Description:** ZothOS Agent Mock Twin Autonomous Offline API Simulator
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_mock_twin.cli serve --host 127.0.0.1 --port 8097`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-mock-twin|Agent Mock Twin]] · [[Workstation agent-mock-twin|Agent Mock Twin // Deterministic API Replay]] · [[CLI agent-mock-twin|agent-mock-twin]] · [[Daemon mock_twin|agent-mock-twin]]