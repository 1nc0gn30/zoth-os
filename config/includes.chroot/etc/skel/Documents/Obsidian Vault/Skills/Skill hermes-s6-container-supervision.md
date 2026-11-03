---
title: "hermes-s6-container-supervision"
tags: [skill, hermes]
aliases: ["hermes-s6-container-supervision"]
---

# hermes-s6-container-supervision

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/devops/hermes-s6-container-supervision/SKILL.md`

## Overview
A DevOps engineering guide for modifying, supervising, and debugging process execution inside the Hermes Agent Docker image using `s6-overlay` (v3). It details container initialization hooks, PID 1 dispatching, static background services (such as the web dashboard), and dynamic per-profile gateway supervision.

## When to Load
- When adding, configuring, or debugging static background services in `docker/s6-rc.d/`.
- When diagnosing why per-profile gateways fail to start, crash loop, or fail to persist across `docker restart`.
- When modifying `cont-init.d` initialization scripts (UID/GID remapping, volume permission seeding, profile reconciliation).
- When inspecting or debugging container entrypoints (`entrypoint-dispatch.sh`, `main-wrapper.sh`).

## Supervision Architecture & Invariants
- **PID 1 Execution:** `/init` runs as PID 1 via `entrypoint-dispatch.sh`, while the container CMD runs `/opt/hermes/docker/main-wrapper.sh` to preserve accurate process exit codes instead of forced SIGTERM (143) halts.
- **Boot Lifecycle:**
  - `01-hermes-setup`: Executes UID/GID remapping, chowns data volumes, seeds configs, and runs `skills_sync.py`.
  - `02-reconcile-profiles`: Walks persistent profile directories containing `SOUL.md` and rebuilds runtime supervision directories under `/run/service/gateway-<name>/`.
- **Service Control:** Management binaries reside in `/command/` (`/command/s6-svstat`, `/command/s6-svc`).
- **Permissions:** Unprivileged agent tasks drop privileges via `s6-setuidgid hermes`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]]