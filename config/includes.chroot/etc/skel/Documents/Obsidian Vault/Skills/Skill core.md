---
title: "core"
tags: [skill, hermes]
aliases: ["core"]
---

# core

- **Origin:** Hermes skill (workstation skill for `agent-browser`, not a Zoth product)
- **Path:** `~/.hermes/tools/agent-browser-0.26.0-linux-x64/skill-data/core/SKILL.md`
- **Allowed Tools:** `agent-browser:*`, `npx agent-browser:*`

## Overview
The foundation operational manual for `agent-browser`, a fast Chrome DevTools Protocol (CDP) browser automation CLI optimized for AI agents without Playwright or Puppeteer dependencies.

## When to Load
- Web navigation, form submissions, button clicking, web scraping, and data extraction.
- Capturing viewport or full-page screenshots, annotated visual maps, or video recordings of web sessions.
- Managing multiple isolated browser contexts, sessions, and persisting authentication state.
- Troubleshooting web automation failures via the built-in diagnostic suite (`agent-browser doctor`).

## Workflow & Operational Primitives
- **The Snapshot-and-Ref Loop:**
  1. `agent-browser open <url>`
  2. `agent-browser snapshot -i` (generates token-efficient `@eN` accessibility handles)
  3. `agent-browser click @eN` / `fill @eN "text"`
  4. Re-snapshot immediately upon DOM mutations or navigation (refs invalidate on state change).
- **Wait Strategies:** Prefers deterministic event triggers (`wait @ref`, `wait --text`, `wait --load networkidle`) over brittle hardcoded sleep intervals.
- **Session & Auth Management:** Supports saving state cookies/storage (`state save ./auth.json`), credentials via the auth vault, and isolated multi-tenant browser sessions (`--session <name>`).

## See also

[[MOC Skills]] · [[Zoth OS]]