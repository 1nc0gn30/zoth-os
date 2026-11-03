---
title: "telephony"
tags: [skill, hermes]
aliases: ["telephony"]
---

# telephony

Provision Twilio phone numbers, handle SMS/MMS messaging, and trigger AI outbound voice calls.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/productivity/telephony/SKILL.md`
- **Helper Script:** `scripts/telephony.py`

## Overview & When to Load

Load this skill when the agent needs practical telephony capabilities without core engine changes:
- Searching, buying, and managing an owned Twilio phone number across sessions.
- Sending outbound SMS / MMS messages and polling inbound SMS via the Twilio REST API without requiring a webhook server.
- Placing direct Twilio phone calls with TTS speech (`Polly`) or custom audio playback URLs (`<Play>`), including IVR / phone tree digit navigation (`--send-digits`).
- Executing outbound conversational AI phone calls via Bland.ai or Vapi (with Twilio number import).

## State & Safety Guidelines

- State is persisted in `${HERMES_HOME:-~/.hermes}/.env` (API keys, phone IDs) and `~/.hermes/telephony_state.json` (owned number defaults and inbox polling checkpoints).
- Mandatory safety invariants: always confirm before calling or texting, never dial emergency numbers, and never store third-party phone numbers in agent memory.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill maps|maps]] · [[Skill google-workspace|google-workspace]] · [[Skill agentmail|agentmail]]