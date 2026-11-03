---
title: "har-derived-api-client"
tags: [skill, hermes]
aliases: ["har-derived-api-client"]
---

# har-derived-api-client

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/web-development/har-derived-api-client/SKILL.md`
- **Category:** web-development

## Overview
Drives a website once with a real browser while recording network traffic to a HAR file, then distills that traffic into the site's private JSON API to call it directly via plain HTTP (`requests`, `httpx`, or `curl`) without keeping a browser in the loop.

## When to Load
- Building a lightweight CLI or API client for a website lacking a public API.
- Replacing repetitive `browser_navigate` calls with direct HTTP requests.
- Reverse-engineering autocomplete, search, feed, or checkout XHR/JSON endpoints.
- Replaying traffic captured on cloud backends (Browserbase, Browser-Use, Firecrawl) or remote CDP connections.

## Key Workflow & Components
- `scripts/har_capture.py`: Captures traffic when Hermes launches a local browser instance (Playwright `record_har_path`).
- `scripts/har_capture_cdp.py`: Attaches to an existing CDP endpoint (cloud backends or `/browser connect`) and captures network events.
- `scripts/har_to_client.py`: Filters HAR records down to XHR/JSON entries, isolates query parameters, headers, and request bodies, and provides replay hints (User-Agent, cookies, auth tokens).
- Does not bypass authentication or CAPTCHAs; captured auth tokens/headers must be forwarded during replay.

## See also

[[MOC Skills]] · [[Zoth OS]]