---
title: "competitor-news-monitor"
tags: [skill, hermes]
aliases: ["competitor-news-monitor"]
---

# competitor-news-monitor

**competitor-news-monitor** is a Hermes workstation skill (not a Zoth product) that tracks named competitors for material business developments and delivers primary-source cited intelligence digests.

- **Origin:** Hermes skill
- **Path:** `~/.hermes/skills/research/competitor-news-monitor/SKILL.md`

### Core Capabilities

- **Watchlist & Contract Specification:** Defines company boundaries, domains, event categories (pricing, launches, executive moves, funding, incidents), and explicit materiality thresholds stored in `~/.hermes/competitor-watches/<slug>.json`.
- **Primary Source Hierarchy:** Scans official company blogs, product changelogs, pricing tables, regulatory filings, and status pages alongside trade press.
- **Event Deduplication:** Collapses syndicated articles, wire rewrites, and PR re-posts into single underlying business events with attached corroboration.
- **Materiality Scoring:** Evaluates market impact, novelty, source authority, and confidence, discarding low-signal chatter.
- **Scheduled Autonomous Ticks:** Integrates with Hermes `cronjob` schedules to run recurring incremental checks, updating cutoff timestamps and reporting only high-confidence developments.

### When to Load

Load when configuring ongoing competitive intelligence tracking, monitoring rival product or pricing shifts, or executing scheduled recurring digest ticks. Use direct web search or `blogwatcher` for ad-hoc queries or raw feed feeds.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill blogwatcher|blogwatcher]] · [[Skill rss-feeds|rss-feeds]] · [[Skill reddit-reading|reddit-reading]]