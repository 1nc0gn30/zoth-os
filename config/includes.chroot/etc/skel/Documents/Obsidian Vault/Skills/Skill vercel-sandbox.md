---
title: "vercel-sandbox"
tags: [skill, hermes]
aliases: ["vercel-sandbox"]
---

# vercel-sandbox

> **Workstation Skill (Hermes)** — Origin: Hermes skill (workstation skill, not a Zoth product).

A workstation skill enabling headless Chrome and `agent-browser` automation inside ephemeral **Vercel Sandbox microVMs** (`@vercel/sandbox`).

### Overview & Capabilities
- **Serverless Automation:** Spins up on-demand Linux microVMs to run Chromium without binary size limits imposed by standard serverless functions.
- **Framework Support:** Operates seamlessly with Vercel server-side runtimes across Next.js, SvelteKit, Nuxt, Remix, and Astro.
- **Session Persistence:** MicroVM instances persist state across multi-step commands, supporting form interactions, element reference targeting, and network idle waits.
- **Visual & DOM Extraction:** Produces base64 full-page screenshots (`screenshot --json`) and accessibility tree snapshots (`snapshot -i -c`).
- **VM Snapshots:** Uses pre-baked snapshot IDs (`AGENT_BROWSER_SNAPSHOT_ID`) for sub-second VM boots instead of re-installing Chromium system libraries.
- **Scheduled Automation:** Integrates with Vercel Cron routes for recurring web monitoring, audits, and data extraction.

### When to Load
- Running browser automation, testing, or scraping tasks from Vercel-deployed applications.
- Needing headless Chrome in an isolated microVM without lambda package size constraints.
- Triggered by requests mentioning "Vercel Sandbox browser", "microVM Chrome", or "agent-browser in sandbox".

- **Dependencies:** `@vercel/sandbox`, `agent-browser`
- **Path:** `~/.hermes/tools/agent-browser-0.26.0-linux-x64/skill-data/vercel-sandbox/SKILL.md`

## See also

[[MOC Skills]] · [[Zoth OS]]