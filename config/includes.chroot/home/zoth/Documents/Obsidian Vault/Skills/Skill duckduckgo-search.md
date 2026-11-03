---
title: "duckduckgo-search"
tags: [skill, hermes]
aliases: ["duckduckgo-search"]
---

# duckduckgo-search

Free, keyless search workflow providing web, news, image, and video queries via the DuckDuckGo `ddgs` CLI and Python interface without requiring third-party API keys.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/duckduckgo-search/SKILL.md`
- **Author:** gamedevCloudy

## When to Load
Load this skill as an unauthenticated fallback when standard search APIs (such as Firecrawl) are absent, credentials are unset, or when DuckDuckGo indexing is specifically required.

## Access Methods
1. **CLI Search (`ddgs` via terminal):** Preferred execution path. Avoids package dependency conflicts across execution runtimes.
   - Text search: `ddgs text -q "query" -m 5 -o json`
   - News search: `ddgs news -q "topic" -m 5`
   - Image & Video: `ddgs images -q "query"` or `ddgs videos -q "query"`
   - Flags: `-r` (region), `-t` (time range: `d`, `w`, `m`, `y`), `-s` (safe search), `-o json` (structured output).
2. **Python API (`from ddgs import DDGS`):**
   - Available after confirming package presence in the target Python environment (`pip install ddgs`).
   - Keyword-only argument invariant: `max_results` must be explicitly passed as a keyword argument (e.g., `ddgs.text("query", max_results=5)`).

## Workflow Integration
Outputs titles, snippets, and target URLs. Pair with `web_extract`, `curl`, or browser tools to pull full document text.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill arxiv|arxiv]]