---
title: "scrapling"
tags: [skill, hermes]
aliases: ["scrapling"]
---

# scrapling

Web scraping, crawling, and anti-bot bypass framework providing high-speed HTTP extraction, headless browser automation, and stealth Cloudflare challenge solving.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/research/scrapling/SKILL.md`

### When to Load
- Scraping static HTML pages or REST endpoints faster than full browser automation tools.
- Scraping single-page applications (SPAs) or lazy-loaded pages that require JavaScript execution and network idle triggers.
- Bypassing anti-bot protections or Cloudflare Turnstile verification when `web_extract` is blocked.
- Running multi-page crawling operations with automated link traversal, session persistence, and pause/resume checkpoints.

### Fetching Strategies
- **HTTP (`Fetcher` / `FetcherSession`):** Fast static page and API retrieval with browser impersonation (`impersonate="chrome"`).
- **Dynamic (`DynamicFetcher` / `DynamicSession`):** Headless browser rendering with element wait selectors, custom Playwright actions, and optional resource blocking for speed.
- **Stealth (`StealthyFetcher` / `StealthySession`):** Anti-bot evasion incorporating Cloudflare challenge solving (`solve_cloudflare=True`), WebRTC blocking, and canvas fingerprint hiding.
- **Spider Framework (`Spider`):** Asynchronous multi-page crawling with concurrent request controls and multi-session routing between fast and stealth fetchers.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill duckduckgo-search|duckduckgo-search]] · [[Skill domain-intel|domain-intel]]