---
title: "reddit-reading"
tags: [skill, hermes]
aliases: ["reddit-reading"]
---

# reddit-reading

Headless, read-only Reddit scraper and extractor that reads subreddits, searches, comment trees, and user activity without browser automation or user accounts.

- **Origin:** Hermes skill (`optional-skills/social-media/reddit-reading`)
- **Author:** Teknium (teknium1), Hermes Agent
- **Platforms:** Linux, macOS, Windows
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Reading, summarizing, or analyzing Reddit discussions, subreddit feeds, or user profiles.
- Resolving `reddit.com` links on headless servers or datacenter IPs where web browsers, `r.jina.ai`, or `.json` endpoints encounter 403 or bot-verification walls.
- Performing grounded community research without interactive browser overhead.
- *Restriction:* Strictly read-only; does not support voting, posting, or user credential login.

## Dual Backend Architecture
The underlying script (`scripts/reddit.py`) automatically routes queries across two tiers:
1. **Anonymous Feeds (Default):**
   - Requires zero configuration or API keys; consumes public `.rss`/Atom endpoints.
   - Throttled to ~1 request per minute per IP.
   - Provides post content and top-level comments without vote scores.
2. **OAuth App Credentials (Optional Upgrade):**
   - Uses app-only `client_credentials` grant via `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` in `~/.hermes/.env`.
   - Increases throughput to ~100 requests per minute with full nested comment trees and scores.

## Key CLI Commands
- `python3 scripts/reddit.py doctor`: Inspects active backend mode and rate limit status.
- `python3 scripts/reddit.py sub <name> --sort <hot|new|top>`: Lists subreddit posts.
- `python3 scripts/reddit.py search "<query>" [--sub <name>]`: Queries Reddit or a targeted subreddit.
- `python3 scripts/reddit.py thread <url> --limit <N>`: Fetches full discussion body and comments.
- `python3 scripts/reddit.py user <username>`: Extracts public post and comment history.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill rss-feeds|rss-feeds]] · [[Skill grounded-citations|grounded-citations]] · [[Skill blocked-page-recovery|blocked-page-recovery]] · [[Skill xurl|xurl]]