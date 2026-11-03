---
title: "agent-browser"
tags: [skill, hermes]
aliases: ["agent-browser"]
---

# agent-browser

A workstation skill from Hermes for fast browser automation via a native Rust CLI, driving Chrome and Chromium over the Chrome DevTools Protocol (CDP).

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/tools/agent-browser-0.26.0-linux-x64/skills/agent-browser/SKILL.md`

## When to load
Load this skill when an AI agent needs programmatic web or desktop browser interaction:
- Navigating web pages, clicking elements, filling forms, and taking screenshots.
- Extracting accessibility-tree snapshots with compact `@eN` element references without Playwright or Puppeteer dependencies.
- Managing persistent authentication vaults, browser sessions, and video recordings.
- Automating Electron desktop applications (e.g., VS Code, Slack, Discord, Figma, Notion).
- Running browser tasks inside Vercel Sandbox microVMs or AWS Bedrock AgentCore cloud browsers.

## Sub-skill discovery
The root skill serves as a discovery stub. Detailed runtime workflows and guides are fetched directly through the CLI to match the installed binary version:
- `agent-browser skills get core`: Core workflows, common interaction patterns, and troubleshooting (`--full` for command references).
- `agent-browser skills get electron`: Automation for Electron desktop applications.
- `agent-browser skills get slack`: Slack workspace automation.
- `agent-browser skills get dogfood`: Exploratory testing, QA, and bug hunts.
- `agent-browser skills get vercel-sandbox`: Running automation in Vercel microVMs.
- `agent-browser skills get agentcore`: AWS Bedrock AgentCore cloud browser integration.

## See also

[[MOC Skills]] · [[Zoth OS]]