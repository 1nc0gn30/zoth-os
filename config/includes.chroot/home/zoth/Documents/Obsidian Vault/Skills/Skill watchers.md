---
title: "watchers"
tags: [skill, hermes]
aliases: ["watchers"]
---

# watchers

> **Workstation Skill (Hermes)** — Origin: Hermes skill (workstation skill, not a Zoth product).

A DevOps automation skill providing lightweight polling scripts to monitor RSS feeds, GitHub repositories, and HTTP JSON APIs with bounded watermark deduplication.

### Ready-Made Watcher Scripts
- **`watch_rss.py`:** Monitors RSS 2.0 and Atom feeds, deduplicating entries by `<guid>` or `<id>`.
- **`watch_github.py`:** Tracks GitHub repository issues, pull requests, releases, and commits using `id` or commit `sha` (utilizes `GITHUB_TOKEN`).
- **`watch_http_json.py`:** Polls arbitrary JSON endpoints returning object lists with custom item paths and ID fields.
- **Shared Watermark Helper (`_watermark.py`):** Provides atomic state persistence and bounds watermark memory (capped at 500 IDs).

### Operational Invariants & Mental Model
- **Baseline Priming:** The first execution records existing entries as a baseline without emitting historical backlog items.
- **Silent on No-Change:** Outputs empty stdout when no new items are detected, avoiding cron/chat notification spam.
- **State Management:** Persists state files as JSON in `$HERMES_HOME/watcher-state/<name>.json`.
- **Cron Automation:** Designed to run via terminal commands inside scheduled cron loops.

### When to Load
- User asks to monitor an RSS/Atom feed, GitHub repo activity, or REST API for updates.
- Setting up scheduled interval polling with automated change detection and deduplication.

- **Author / License:** Hermes Agent · MIT License
- **Platforms:** Linux, macOS
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/devops/watchers/SKILL.md`

## See also

[[MOC Skills]] · [[Zoth OS]]