---
title: "agent-flight-recorder"
tags: [os, daemon]
aliases: ["flight_recorder", "agent-flight-recorder"]
port: 8104
subsystem: "Agent Mesh"
status: "standby"
health_url: "http://127.0.0.1:8104/api/health"
repo: "/home/zoth/NullAITech/agent-flight-recorder"
---

# agent-flight-recorder

Black Box Telemetry Forensics Hub

- **Name:** `agent-flight-recorder`
- **Ports:** 8104
- **Health:** `http://127.0.0.1:8104/api/health`
- **Stats:** `http://127.0.0.1:8104/api/stats`
- **Repo:** `/home/zoth/NullAITech/agent-flight-recorder`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio agent-flight-recorder|Agent Flight Recorder]] · [[Workstation agent-flight-recorder|Agent Flight Recorder // Black Box Forensics]] · [[Unit agent-flight-recorder.service|agent-flight-recorder.service]]