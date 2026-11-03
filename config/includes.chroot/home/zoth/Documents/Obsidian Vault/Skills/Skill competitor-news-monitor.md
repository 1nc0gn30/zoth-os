---
title: "competitor-news-monitor"
tags: [skill, hermes]
aliases: ["competitor-news-monitor"]
---

# competitor-news-monitor

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/research/competitor-news-monitor/SKILL.md`
- **Tags:** `Competitors`, `News`, `Market-Research`, `Monitoring`

## Overview
A research and monitoring skill designed to track a declared set of competitor companies and produce cited digests of material, new developments using primary-source evidence.

## When to Load
- User requests monitoring competitors over time (e.g., weekly or monthly updates).
- Tracking pricing changes, product launches, executive appointments, funding, partnerships, or incidents.
- Running scheduled cron ticks via the `competitor-watch` automation blueprint.
- *Do not use for:* One-off company searches (use direct web extraction) or basic feed reading.

## Workflow & Mechanics
- **Setup Phase:** Establishes a watch contract defining canonical company names, domains, categories, and materiality thresholds stored under `~/.hermes/competitor-watches/<watch-slug>.json`, then creates a recurring cron job.
- **Source Coverage:** Surfaces signals from official newsrooms, changelogs, pricing pages, investor relations, status monitors, and trade press.
- **Tick Execution:**
  - Collects news incrementally from the previous timestamp cutoff.
  - Deduplicates syndicated stories and press releases by underlying real-world event.
  - Assesses materiality against defined thresholds, distinguishing hard facts from speculative signals.
  - Treats source failures as documented coverage gaps rather than absence of news.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill blogwatcher|blogwatcher]] · [[Skill rss-feeds|rss-feeds]] · [[Skill reddit-reading|reddit-reading]]