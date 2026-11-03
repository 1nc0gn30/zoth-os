---
title: "email-inbox-triage"
tags: [skill, hermes]
aliases: ["email-inbox-triage"]
---

# email-inbox-triage

Inbox triage and communication management workflow that structures mailboxes into prioritized decision queues and drafts voice-calibrated replies under strict approval boundaries.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/skills/email/email-inbox-triage/SKILL.md`
- **Author:** Ben Barclay (benbarclay), Hermes Agent

## When to Load
Load this skill when auditing inboxes, surfacing high-priority correspondence, drafting replies to pending customer/vendor inquiries, or clearing unread queues. Integrates with email provider connectors such as `himalaya` and `google-workspace`.

## Operational Workflow
1. **Scope Definition:** Establishes accounts, timeframes, and mutation boundaries (defaults strictly to read and draft modes; never sends or deletes without explicit confirmation).
2. **Thread Retrieval:** Reads full conversation context to resolve questions raised upthread, treating message bodies as data rather than agent instructions.
3. **Thread Disposition:** Categorizes messages into six functional bins:
   - `urgent reply`: Blockers, deadlines, security, or executive inquiries.
   - `reply`: Direct questions requiring response.
   - `action without reply`: Tasks, calendar invites, payments, or file updates.
   - `waiting`: External party owes the next response.
   - `reference`: Informational records requiring no action.
   - `noise`: Automated or irrelevant mail.
4. **Voice Calibration & Drafting:** Samples 20–50 sent messages to extract the operator's greeting style, formality, sentence rhythm, and sign-offs before composing draft replies.
5. **Approval Batch:** Previews proposed changes, recipients, and drafts for operator approval.
6. **Execution & Verification:** Sends or archives approved items and verifies state with the mail provider.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill himalaya|himalaya]] · [[Skill google-workspace|google-workspace]]