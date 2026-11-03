---
title: "long-running-background-tasks"
tags: [skill, grok]
aliases: ["long-running-background-tasks"]
---

# long-running-background-tasks

Supervision protocols and discipline for launching, monitoring, and validating persistent background tasks (CI runs, builds, servers, training loops).

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/long-running-background-tasks`)
- **When to load:** Mandatory before starting, watching, diagnosing, or reporting on any asynchronous process or background job.

## Core Directives

- **Definition of Done:** Merely queuing or backgrounding a job is never complete. A task is only done when the process has terminated cleanly and its outputs are verified.
- **Wakeup Minimization:** Background watchers must stay silent when healthy to conserve context and avoid unnecessary interruptions, firing immediately only on actionable state changes or terminal failure.

## Supervision Strategies

- **`monitor` (Deterministic Predicates):** Lightweight shell or Python polling scripts for computable states (HTTP endpoints, open ports, exit codes, git PR statuses). Emits explicit tokens (`ACTION_REQUIRED`, `DONE`, `FAILED`, `CANCELLED`).
- **`loop` (Qualitative Diagnostics):** Scheduled subagent runs that inspect complex logs (e.g., loss curves, memory degradation, silent hangs) where deterministic predicates cannot capture system health.

## Operational Hygiene

- **Fail-Fast Discipline:** Emit failure immediately on fatal thresholds rather than waiting for timeouts.
- **Process Isolation & Cleanup:** Route diagnostics to PID-keyed log files under persistent directories. Kill prior watchers, loops, and orphaned processes before restarting.
- **Monitor Limits:** Track the 10-hour runtime cap on background monitors, restarting watchers if jobs outlive the window.

## See also

[[MOC Skills]] · [[Zoth OS]]