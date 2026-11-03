---
title: "agent-flight-recorder.service"
tags: [os, systemd]
---
# agent-flight-recorder.service

ZothOS Agent Flight Recorder & Telemetry Forensics Hub

- **Unit:** `agent-flight-recorder.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_flight_recorder.cli serve --host 127.0.0.1 --port 8104`

- **Description:** ZothOS Agent Flight Recorder & Telemetry Forensics Hub
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m agent_flight_recorder.cli serve --host 127.0.0.1 --port 8104`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio agent-flight-recorder|Agent Flight Recorder]] · [[Workstation agent-flight-recorder|Agent Flight Recorder // Black Box Forensics]] · [[Daemon flight_recorder|agent-flight-recorder]]