---
title: "rss-feeds"
tags: [skill, hermes]
aliases: ["rss-feeds"]
---

# rss-feeds

Zero-dependency standard library utility for parsing and discovering RSS 2.0, RSS 1.0/RDF, Atom, and JSON feeds. It outputs date-sorted, normalized entry summaries and locates feed links behind regular web pages.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/research/rss-feeds/SKILL.md`

### When to Load
- Polling updates from blogs, changelogs, GitHub releases/tags (`.atom`), YouTube channels, arXiv feeds, or subreddits.
- Building recurring monitoring digests with `cronjob_manage` where structured feeds are cheaper and more reliable than HTML page scraping.
- Discovering candidate feed URLs from a standard website via `<link rel="alternate">` or standard endpoints (`/feed`, `/rss.xml`, `/atom.xml`).
- Extracting metadata (`title`, `link`, UTC ISO 8601 `published`, `author`, stripped `summary`) prior to fetching full article bodies via `web_extract`.

### Usage & Workflow
- **Read feed:** `python3 scripts/feed.py read <URL> [--limit N] [--since YYYY-MM-DD] [--json]`
- **Discover feeds:** `python3 scripts/feed.py discover <site-URL>`
- Automatically normalizes RFC 822 and ISO 8601 timestamps to UTC and sorts entries newest-first.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill reddit-reading|reddit-reading]] · [[Skill competitor-news-monitor|competitor-news-monitor]] · [[Skill grounded-citations|grounded-citations]] · [[Skill youtube-content|youtube-content]] · [[Skill blogwatcher|blogwatcher]]