---
title: "live-dashboard"
tags: [skill, hermes]
aliases: ["live-dashboard"]
---

# live-dashboard

`live-dashboard` is a Hermes workstation skill for building self-contained, automated HTML status dashboards backed by structured JSON state and kept up to date via scheduled background cron ticks.

- **Origin:** Hermes workstation skill (authored by Teknium / Hermes Agent, not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/productivity/live-dashboard/SKILL.md`
- **Category:** Productivity / Monitoring
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Tracking entities (applications, deal pipelines, shipments, system issues) aggregated across disparate live sources (email, web extract, local files).
- Creating standalone HTML status dashboards rendered via `desktop_preview` or viewed directly in a browser.
- Scheduling recurring background refreshes via the Hermes `cronjob` tool.
- *Note:* Do not use for one-off ad-hoc questions or single-item price/news tracking.

## Key Capabilities & Workflow

- **Data Contract & Verification:** Establishes tracked entities, indicator fields, source connectors, and attention triggers, verifying each source via an initial foreground read.
- **Dual-File Architecture:** Maintains authoritative state and history in `dashboards/<slug>/dashboard.json` and compiles a standalone, self-contained `index.html` with zero external dependencies.
- **Fail-Safe Ticks:** If an upstream source read fails during a cron tick, marks the metric as stale without overwriting last-known-good values.
- **Noise Suppression:** Follows a strict alert discipline: notifies the user only when material changes or new needs-attention conditions arise; otherwise responds with `[SILENT]`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill product-price-monitor|product-price-monitor]] · [[Skill competitor-news-monitor|competitor-news-monitor]] · [[Skill email-inbox-triage|email-inbox-triage]] · [[Skill google-workspace|google-workspace]]