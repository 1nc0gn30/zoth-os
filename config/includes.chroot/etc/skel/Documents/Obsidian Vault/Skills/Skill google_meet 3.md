---
title: "google_meet"
tags: [skill, hermes]
aliases: ["google_meet"]
---

# google_meet

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/installs/76fe6b73b96f244c/environments/5a818c3999ea454aad33be2b0a27247e/workspace/plugins/google_meet/SKILL.md`

## Overview

Automates participation in Google Meet calls through Playwright browser automation. The bot joins meetings, captures live captions to create a transcript, optionally speaks in real time, and produces meeting summaries and action items.

## When to Load

- Direct user requests such as "join my Meet at <url>", "sit in on my meeting", or "summarize the standup".
- Automatically logging discussions and drafting follow-ups or tickets.
- Providing an AI voice participant in calls with speech synthesis capabilities.

## Operating Modes & Functions

- **Modes:**
  - `transcribe`: Read-only caption scraping (default, lightweight).
  - `realtime`: Live audio response using OpenAI Realtime and a virtual loopback device (`pulseaudio-utils` on Linux, BlackHole on macOS).
- **Locations:**
  - *Local:* Runs headless Chromium locally.
  - *Remote Node:* Delegates browser execution to a separate machine via WebSocket token authentication.
- **Tool APIs:**
  - `meet_join`: Connects to target meeting URL (`https://meet.google.com/...`).
  - `meet_status`: Checks admission, liveness, and error metrics.
  - `meet_transcript`: Fetches latest caption entries.
  - `meet_say`: Sends synthesized speech when running in realtime mode.
  - `meet_leave`: Exits the call and saves local transcript to disk.

## Limits & Safety

- Strictly restricted to `https://meet.google.com/` URLs.
- 5-minute lobby timeout if not admitted by the call host.
- One active session per location; Windows OS is not supported.

## See also

[[MOC Skills]] · [[Zoth OS]]