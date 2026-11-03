---
title: "google_meet"
tags: [skill, hermes]
aliases: ["google_meet"]
---

# google_meet

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/plugins/google_meet/SKILL.md`

## Overview

Controls an automated attendee bot for Google Meet calls via Playwright. It transcribes live conversation captions, optionally speaks using OpenAI Realtime audio, and records transcripts for subsequent summaries and follow-ups.

## When to Load

- Prompted with commands such as "join my Meet at <url>", "sit in on my standup", or "take notes and summarize".
- Creating automated meeting records, extracting action items, or scheduling post-meeting tasks.
- In-call conversational assistance requiring speech output into the meeting.

## Architecture & Tool Interfaces

- **Modes:**
  - `transcribe`: Listen-only mode capturing Google Meet live closed captions.
  - `realtime`: Bidirectional mode driving audio into the call via OpenAI Realtime and a virtual audio device.
- **Topology:** Runs either locally on the host gateway or remotely on a designated node machine running a signed-in Chrome profile.
- **Tools:**
  - `meet_join(url, mode, guest_name, duration, headed, node)`: Launches browser and connects to call.
  - `meet_status(node)`: Returns connection state, lobby status, captioning flags, and error states.
  - `meet_transcript(last, node)`: Retrieves recent caption entries.
  - `meet_say(text, node)`: Queues spoken audio during realtime sessions.
  - `meet_leave(node)`: Hangs up and finalizes the text transcript under `$HERMES_HOME/workspace/meetings/`.

## Key Invariants

- URL validation requires `https://meet.google.com/...`.
- If the host does not admit the bot within 5 minutes, it exits with `leaveReason: "lobby_timeout"`.
- Supports Linux and macOS; Windows is not supported.

## See also

[[MOC Skills]] · [[Zoth OS]]