---
title: "honcho"
tags: [skill, hermes]
aliases: ["honcho"]
---

# honcho

Configure and troubleshoot Honcho cross-session user modeling and memory for Hermes Agent.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/autonomous-ai-agents/honcho/SKILL.md`
- **Prerequisites:** `honcho-ai` (Python package via pip)

## Purpose & Overview

Honcho provides AI-native cross-session user modeling and dialectic reasoning. It maintains a shared, unified understanding of the user across conversations while assigning each Hermes profile its own distinct AI peer identity.

## When to Load

- Configuring cloud (`app.honcho.dev`) or self-hosted local Honcho memory endpoints.
- Setting up multi-profile workflows where separate agents develop distinct AI identities over a shared user workspace.
- Tuning memory recall modes (`hybrid`, `context`, `tools`), observation directions (`observeMe`, `observeOthers`), or context token caps.
- Adjusting dialectic synthesis knobs: cadence (frequency of calls), depth (1–3 reasoning passes), and intensity level (`minimal` to `max`).
- Utilizing or debugging the 5 Honcho memory tools: `honcho_profile`, `honcho_search`, `honcho_context`, `honcho_reasoning`, and `honcho_conclude`.

## Key Commands

- `hermes honcho setup`: Interactive setup wizard for cloud or local endpoints.
- `hermes honcho status`: Displays resolved configuration, active peers, and connection status.
- `hermes honcho mode`: Sets recall strategy (`hybrid`, `context`, `tools`).
- `hermes honcho sync`: Backfills peer host blocks across all Hermes profiles.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]]