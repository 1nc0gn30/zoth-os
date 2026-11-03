---
title: "Agent Capsule Jail // Kernel Sandbox & Isolation"
tags: [studio, workstation]
aliases: ["agent-capsule-jail"]
---

# Agent Capsule Jail // Kernel Sandbox & Isolation

Kernel enclave sandbox, resource quotas, and ephemeral process isolation for AI agents.

## Specification & Taxonomy

- **ID:** `agent-capsule-jail`
- **Name:** Agent Capsule Jail // Kernel Sandbox & Isolation
- **Type:** `integrated_tool` (Standalone sovereign micro-tool and CLI utility in the Tool Arsenal)
- **Band:** Security
- **Static Path:** `/studio/agent-capsule.html`
- **In-App Route:** `/tools/agent-capsule-jail`
- **Repository ID:** `agent-capsule-jail`
- **Launch Command:** `./bin/agent-capsule serve --port 8105`

## Operational Profile

Categorized under the **Security** functional band in Zoth Studio v2 as an integrated sovereign tool. Focuses on isolating untrusted agent workloads within kernel enclave sandboxes, enforcing strict resource quotas, and providing ephemeral process isolation. Accessible via the static Studio console, routed through the in-app tool bench, or hosted standalone via its local CLI daemon service on port 8105.

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Studio agent-capsule-jail|Agent Capsule Jail]] · [[Daemon capsule_jail|agent-capsule-jail]] · [[Unit agent-capsule-jail.service|agent-capsule-jail.service]]