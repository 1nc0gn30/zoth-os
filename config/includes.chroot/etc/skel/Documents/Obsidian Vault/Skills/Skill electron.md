---
title: "electron"
tags: [skill, hermes]
aliases: ["electron"]
---

# electron

Desktop automation skill for controlling, testing, and scraping Chromium-based Electron applications (such as VS Code, Slack, Discord, Figma, Notion, and Obsidian) via `agent-browser` using the Chrome DevTools Protocol (CDP).

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/tools/agent-browser-0.26.0-linux-x64/skill-data/electron/SKILL.md`
- **Tooling:** `agent-browser` CLI / `npx agent-browser`

## When to Load
Load this skill when automating native Electron desktop applications, testing desktop UI flows, attaching to running apps over CDP, capturing desktop window screenshots, or extracting UI states from local desktop clients.

## Core Operational Workflow
1. **Launch with Remote Debugging:** Start the target application with a designated debugging port flag (e.g., `code --remote-debugging-port=9223` or `slack --remote-debugging-port=9222`).
2. **Connect CDP Client:** Attach the automation engine via `agent-browser connect <port>` (or `agent-browser --auto-connect`).
3. **Snapshot & Element Discovery:** Inspect interactive elements using accessibility snapshots (`agent-browser snapshot -i`).
4. **Target Interaction:** Click, type, and navigate using generated element references (`agent-browser click @e1`, `agent-browser fill @e2 "query"`).
5. **Webview & Multi-Window Switching:** Enumerate active windows and embedded `<webview>` tags via `agent-browser tab`, then switch context with `agent-browser tab <index>`.

## Advanced Capabilities
- **Named Sessions:** Controls multiple desktop apps concurrently using isolated sessions (`agent-browser --session slack connect 9222`).
- **Visual Capture:** Takes annotated or full-canvas screenshots (`agent-browser screenshot --annotate app.png`).
- **Theme Preservation:** Configurable color schemes via `AGENT_BROWSER_COLOR_SCHEME=dark`.

## See also

[[MOC Skills]] · [[Zoth OS]]