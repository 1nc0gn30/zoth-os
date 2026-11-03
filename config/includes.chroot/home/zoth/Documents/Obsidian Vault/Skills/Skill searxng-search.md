---
title: "searxng-search"
tags: [skill, hermes]
aliases: ["searxng-search"]
---

# searxng-search

Privacy-preserving, keyless meta-search skill querying 70+ search engines simultaneously via SearXNG. It serves as a free search fallback when primary paid web search toolsets are not configured.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/searxng-search/SKILL.md`

### When to Load
- Performing web searches without commercial API keys (e.g., when `FIRECRAWL_API_KEY` is unavailable).
- Querying self-hosted or public SearXNG aggregator instances configured via `SEARXNG_URL`.
- Filtering search queries by categories (`news`, `science`, `general`) and engine subsets (`google`, `bing`, `ddg`).
- Retrieving candidate URLs and snippets prior to full-text extraction via `web_extract`.

### Usage & Configuration
- **Prerequisite:** Set `SEARXNG_URL` to an active local (`http://localhost:8888`) or public SearXNG endpoint.
- **CLI Query:** `curl -s "${SEARXNG_URL}/search?q=<query>&format=json&engines=google,bing&limit=10"`
- **Python Integration:** Calls the `/search` REST endpoint with JSON formatting and extracts `title`, `url`, `content` snippet, and `engine` attribution.
- Supports safesearch controls (`safesearch=0,1,2`) and time range filtering (`day`, `week`, `month`, `year`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill duckduckgo-search|duckduckgo-search]] · [[Skill domain-intel|domain-intel]]