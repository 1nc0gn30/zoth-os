---
title: "Agent Budget Sentinel // Token Cost Circuit Breaker"
tags: [studio, workstation]
aliases: ["agent-budget-sentinel"]
---

# Agent Budget Sentinel // Token Cost Circuit Breaker

Autonomous zero-dependency spending guardrail, real-time token cost circuit breaker, and runaway loop interceptor.

## Specification & Taxonomy

- **ID:** `agent-budget-sentinel`
- **Name:** Agent Budget Sentinel // Token Cost Circuit Breaker
- **Type:** `integrated_tool` (Standalone sovereign micro-tool and CLI utility in the Tool Arsenal)
- **Band:** Observe
- **Static Path:** `/studio/budget-sentinel.html`
- **In-App Route:** `/tools/agent-budget-sentinel`
- **Repository ID:** `agent-budget-sentinel`
- **Launch Command:** `./bin/agent-budget serve --web-port 8110 --proxy-port 8111`

## Operational Profile

Registered in the Zoth Studio v2 matrix under the **Observe** functional band as an integrated sovereign tool. Designed as a standalone utility with zero external dependencies to prevent runaway agent execution loops and enforce real-time token cost guardrails. Can be accessed directly through the static Studio interface, mounted inside the in-app tools router, or executed standalone via its local HTTP/proxy CLI service.

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Studio agent-budget-sentinel|Agent Budget Sentinel]] · [[Daemon budget_sentinel|agent-budget-sentinel]] · [[Unit agent-budget-sentinel.service|agent-budget-sentinel.service]]