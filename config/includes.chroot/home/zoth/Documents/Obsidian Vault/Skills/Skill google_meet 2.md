---
title: "google_meet"
tags: [skill, hermes]
aliases: ["google_meet"]
---

# google_meet

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/installs/76fe6b73b96f244c/environments/28a00ad4f7744cebb92e209294188c43/workspace/plugins/google_meet/SKILL.md`

## Overview

Enables a Hermes agent to join Google Meet sessions via headless Playwright, observe live captions, transcribe conversation, optionally speak using OpenAI Realtime text-to-speech, and generate post-meeting notes or action items.

## When to Load

- User asks the agent to "join my Meet at <url>", "sit in on my standup", or "take notes on this meeting".
- Generating meeting summaries, follow-up emails, or issue trackers from live discussions.
- Participating vocally in real-time meetings on command (`meet_say`).

## Operating Modes & Architecture

- **Modes:**
  - `transcribe` (default): Listen-only; joins meeting, enables live captions, and extracts text lines.
  - `realtime`: Bidirectional; feeds spoken audio into the call via OpenAI Realtime API and a configured virtual audio device (`pulseaudio-utils` on Linux, BlackHole on macOS).
- **Execution Locations:**
  - *Local:* Runs Chromium Playwright directly on the local gateway.
  - *Remote Node (`node="<name>"`):* Connects over WebSocket RPC to an external machine with a signed-in Chrome session.
- **Core Functions:**
  - `meet_join(url, mode, guest_name, duration, headed, node)`: Initiates session.
  - `meet_status(node)`: Reports lobby waiting state, admission, captioning, and audio output.
  - `meet_transcript(last, node)`: Reads recent caption lines without pulling full history.
  - `meet_say(text, node)`: Streams TTS speech into realtime meetings.
  - `meet_leave(node)`: Disconnects the bot and finalizes the transcript file.

## Constraints & Safety

- Only accepts valid `https://meet.google.com/...` URLs.
- Single active meeting allowed per host/node instance.
- Times out after 5 minutes if left waiting in the host lobby. Windows is unsupported.

## See also

[[MOC Skills]] · [[Zoth OS]]