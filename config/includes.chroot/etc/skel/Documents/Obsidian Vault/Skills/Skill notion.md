---
title: "notion"
tags: [skill, hermes]
aliases: ["notion"]
---

# notion

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/productivity/notion/SKILL.md`
- **Category:** Productivity / Notes / Database
- **Platforms:** Linux, macOS, Windows

## Overview

The `notion` workstation skill equips agents to interact with Notion workspaces via the official `ntn` CLI or direct HTTP REST API calls. It provides workflows for searching workspaces, reading and mutating pages as Markdown, managing structured database records (data sources), uploading files, and deploying Notion Workers.

## When to Load

Load this skill when:
- Reading or summarizing Notion pages and block hierarchies in agent-friendly Markdown.
- Querying, filtering, or appending entries to Notion databases (data sources).
- Creating new documentation or syncing local notes into Notion pages.
- Uploading binary media files or deploying hosted TypeScript Notion Workers.

## Core Access Modes & Capabilities

- **Authentication:** Requires `NOTION_API_KEY` stored in `.env`. Pages and databases must be shared with the integration via Notion's `Connect to` menu.
- **`ntn` CLI (macOS/Linux):** Shorthand command interface supporting fast API queries (`ntn api v1/search`), Markdown retrieval (`ntn api v1/pages/{id}/markdown`), and one-line file uploads (`ntn files create < file.png`).
- **REST API (`curl`):** Universal fallback targeting `https://api.notion.com/v1/` with header `Notion-Version: 2025-09-03` for cross-platform querying, page creation, and block updates.
- **Notion Workers:** Build and deploy hosted TypeScript workers (`ntn workers deploy`) implementing scheduled database syncs, agent tools, and external webhooks.

## See also

[[MOC Skills]] · [[Zoth OS]]