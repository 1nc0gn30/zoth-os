---
title: "blocked-page-recovery"
tags: [skill, hermes]
aliases: ["blocked-page-recovery"]
---

# blocked-page-recovery

Hermes workstation skill authored by Hermes Agent. Labeled as origin, not a Zoth product.

## Overview

Provides a fallback recovery protocol when standard HTTP web fetching fails due to 403/429 status codes, Cloudflare challenges, paywalls, or bot-detection interstitials.

## When to Load

Load when a page fetch fails, returns access restrictions, or hits bot walls, rather than repeatedly querying the blocked URL directly.

## Recovery Ladder

1. **Wayback Machine**: Queries `archive.org/wayback/available` or CDX index for historical snapshots.
2. **archive.today**: Rotates domains (`archive.ph`, `.md`, `.li`, `.is`) for paywalled articles; validates response body content rather than status code.
3. **Jina Reader**: Server-side live markdown rendering via `r.jina.ai` (requires `JINA_API_KEY`).
4. **API-First Pivot**: Inspects host for unblocked endpoints (`/api/`, `/graphql`, `.json`, sitemaps, or RSS feeds).
5. **Real Browser**: Uses full headless browser tool as the final resort.

## Operational Rules & Provenance

- Automated via bundled script: `python3 scripts/recover_page.py <URL> --json`.
- **Provenance Discipline**: Snapshots must be cited with their archive date and clearly distinguished from live content.
- **Rejects Fake Successes**: Filters out defunct Google Cache interstitials, AMP redirect stubs, and multi-KB rate-limit error pages. Prohibits untrusted web proxy relays.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill grounded-citations|grounded-citations]]