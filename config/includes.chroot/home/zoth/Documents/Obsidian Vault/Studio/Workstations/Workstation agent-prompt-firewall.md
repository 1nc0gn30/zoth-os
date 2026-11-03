---
title: "Agent Prompt Firewall // Inline Defense & Radar"
tags: [studio, workstation]
aliases: ["agent-prompt-firewall"]
---

# Agent Prompt Firewall // Inline Defense & Radar

The **Agent Prompt Firewall // Inline Defense & Radar** is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) as an integrated tool within the Tool Arsenal.

### Core Functionality
Autonomous inline prompt injection defense, PII redactor, and real-time SSE threat radar.

### Workstation Metadata
- **ID:** `agent-prompt-firewall`
- **Name:** Agent Prompt Firewall // Inline Defense & Radar
- **Type:** `integrated_tool` (standalone sovereign micro-tool and CLI utility available in the Tool Arsenal)
- **Functional Band:** Security
- **Static Entrypoint:** `/studio/agent-firewall.html`
- **In-App Route:** `/tools/agent-prompt-firewall`
- **Tool Repository ID:** `agent-prompt-firewall`
- **Pull / Launch Command:** `./bin/agent-firewall serve --web-port 8098 --proxy-port 8099`

### Operational Role
Functions under the Security band to intercept incoming prompt injection payloads, redact sensitive PII inline, and stream threat events over SSE via its dedicated web server and proxy listeners.

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Studio agent-prompt-firewall|Agent Prompt Firewall]] · [[Daemon prompt_firewall|agent-prompt-firewall]] · [[Unit agent-prompt-firewall.service|agent-prompt-firewall.service]]