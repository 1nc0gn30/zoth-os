---
title: "slack"
tags: [skill, hermes]
aliases: ["slack"]
---

# slack

Workstation skill from Hermes (not a Zoth product). Driven by `agent-browser` automation tooling.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/tools/agent-browser-0.26.0-linux-x64/skill-data/slack/SKILL.md`

## Overview

Automates interactions with Slack workspaces using browser automation without requiring the Slack API, bot tokens, webhooks, or OAuth.

## When to Load

- Checking unread channels, Activity tabs, or direct messages ("check my Slack", "what channels have unreads").
- Navigating workspace sidebars, channels, and message threads.
- Searching messages, extracting conversations, or locating specific user statements ("find who said", "search Slack for").
- Programmatically parsing channel metadata and capturing annotated evidence screenshots.

## Automation Mechanism

- **Driver:** `agent-browser` connecting via CDP (typically port 9222) or opening `https://app.slack.com`.
- **Workflow:**
  1. `agent-browser connect 9222` or `agent-browser open https://app.slack.com`.
  2. Inspect interactive accessibility refs using `agent-browser snapshot -i` or `--json`.
  3. Target element refs (`@e...`) to switch channels, expand unreads, or trigger search inputs.
  4. Capture visual verification via `agent-browser screenshot` or read message text via `agent-browser get text`.

## See also

[[MOC Skills]] · [[Zoth OS]]