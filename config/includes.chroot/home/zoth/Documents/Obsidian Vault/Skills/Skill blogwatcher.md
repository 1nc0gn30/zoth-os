---
title: "blogwatcher"
tags: [skill, hermes]
aliases: ["blogwatcher"]
---

# blogwatcher

Hermes workstation skill authored by JulienTant (fork of Hyaxia/blogwatcher). Labeled as origin, not a Zoth product.

## Overview

Monitors blogs and RSS/Atom feeds using the `blogwatcher-cli` utility, managing an SQLite database of feeds, articles, and read/unread status.

## When to Load

Load when maintaining recurring monitoring of multiple blogs or RSS/Atom feeds with read/unread state tracking, automatic feed discovery, HTML scraping fallbacks, or OPML imports.

## Key Capabilities & Commands

- **Feed Management**: Add feeds with auto-discovery (`blogwatcher-cli add <name> <url>`), specify feeds directly (`--feed-url`), configure HTML fallback scrapers (`--scrape-selector`), or import from OPML.
- **Article Tracking**: Scan for updates (`scan`), list unread or categorized articles (`articles --category`), and update read states (`read <id>`, `read-all`).
- **Storage**: Persists data in an SQLite database at `~/.blogwatcher-cli/blogwatcher-cli.db` (overrideable with `BLOGWATCHER_DB`).

## Hermes Workflow Integration

- Pairs with Hermes `cronjob` monitoring scripts: runs scans deterministically and wakes the agent only when article output changes.
- Uses Hermes `web_extract` on discovered article URLs for full content reading rather than manual scraping.

## See also

[[MOC Skills]] · [[Zoth OS]]