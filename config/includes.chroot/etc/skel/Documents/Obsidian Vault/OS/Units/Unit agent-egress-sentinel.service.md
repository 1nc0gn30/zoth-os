---
title: "agent-egress-sentinel.service"
tags: [os, systemd]
---
# agent-egress-sentinel.service

ZothOS Agent Egress Sentinel & Network Telemetry Sniffer

- **Unit:** `agent-egress-sentinel.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_egress_sentinel.cli serve --web-host 127.0.0.1 --web-port 8095 --proxy-host 127.0.0.1 --proxy-port 8096`

- **Description:** ZothOS Agent Egress Sentinel & Network Telemetry Sniffer
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_egress_sentinel.cli serve --web-host 127.0.0.1 --web-port 8095 --proxy-host 127.0.0.1 --proxy-port 8096`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-egress-sentinel|Agent Egress Sentinel]] · [[Workstation agent-egress-sentinel|Agent Egress Sentinel // Kinetic Network Radar]] · [[Daemon egress_sentinel|agent-egress-sentinel]]