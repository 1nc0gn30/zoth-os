---
title: "tldraw-offline"
tags: [skill, hermes]
aliases: ["tldraw-offline"]
---

# tldraw-offline

Drive, modify, and script tldraw offline desktop canvases programmatically via local HTTP API.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/tldraw-offline/SKILL.md`
- **Category:** Creative, diagramming, whiteboard

## Overview & When to Load

Load this skill when the user has the tldraw offline desktop app open and requests programmatic canvas manipulation or embedded scripting:
- Generating diagrams, wireframes, flowcharts, and structured canvas layouts via code rather than manual GUI clicking.
- Executing live one-off canvas modifications using the local HTTP API endpoint (`/api/doc/:id/exec`).
- Authoring and maintaining durable document scripts (`script/main.js`) embedded within `.tldraw` files that execute on document load to provide reactive shapes, animations, and interactive controls.

## Operational Workflow

- **Local API Connection:** The desktop app writes runtime connection parameters (`port` default `7236`, bearer `token`, and `pid`) to `server.json` (located at `~/.config/tldraw/server.json` on Linux).
- **Execution Paths:**
  - *Live Edits:* Driven via `curl` POST requests to `/api/doc/$DOC/exec` with the live `editor` and `helpers` in scope.
  - *Durable Scripts:* Located via `/api/doc/$DOC/script-workspace` and hot-reloaded by the app file watcher.

## See also

[[MOC Skills]] · [[Zoth OS]]