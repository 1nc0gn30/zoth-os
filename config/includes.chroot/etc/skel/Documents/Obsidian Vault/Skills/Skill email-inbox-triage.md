---
title: "email-inbox-triage"
tags: [skill, hermes]
aliases: ["email-inbox-triage"]
---

# email-inbox-triage

Turn a mailbox into a bounded queue of decisions. This workstation skill owns thread-aware prioritization and safe reply drafting policies, delegating provider commands to connector skills like `himalaya` or `google-workspace`.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/email/email-inbox-triage/SKILL.md`
- **Tags:** Email, Inbox, Triage, Replies, Productivity

## When to Load

Load when triaging incoming mail, asking what emails require attention, getting to inbox zero, drafting responses to urgent items, or finding unanswered customer and vendor threads. Do not use for newsletter campaigns or single-message lookups.

## Operational Workflow

1. **Set inbox scope:** Define account, target folders/labels, time window, unread filters, and thread count limits. Defaults strictly to read + draft mode.
2. **Retrieve complete threads:** Query via connectors (`himalaya`, `google-workspace`) and read full context rather than isolated messages.
3. **Classify disposition:** Sort threads into `urgent reply`, `reply`, `action without reply`, `waiting`, `reference`, or `noise`.
4. **Calibrate user voice:** Inspect 20–50 sent replies to match tone, sign-offs, and conciseness before drafting.
5. **Approval batch:** Present actions, summaries, deadlines, and risks for explicit batch approval.
6. **Apply & verify:** Mutate mailboxes only on approved items and read back status to ensure delivery.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill himalaya|himalaya]] · [[Skill google-workspace|google-workspace]]