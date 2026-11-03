---
title: "teams-meeting-pipeline"
tags: [skill, hermes]
aliases: ["teams-meeting-pipeline"]
---

# teams-meeting-pipeline

Teams meeting summaries, job replay, and Microsoft Graph subscription operations.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/productivity/teams-meeting-pipeline/SKILL.md`
- **Platform Scope:** Linux, macOS, Windows; session platforms: `teams`, `cron`

## Overview & When to Load

Load this skill whenever interacting with Microsoft Teams meeting workflows:
- Summarizing Teams meetings, resolving transcripts, and extracting action items.
- Checking pipeline status, inspecting stored meeting jobs (`hermes teams-pipeline list`, `show <job-id>`), or replaying failed jobs (`hermes teams-pipeline run <job-id>`).
- Dry-running transcript and artifact resolution via meeting ID or join URL (`hermes teams-pipeline fetch`).
- Validating Microsoft Graph connectivity and token health (`validate`, `token-health`).
- Managing and renewing Microsoft Graph webhook subscriptions (`subscribe`, `renew-subscription`, `maintain-subscriptions`).

## Prerequisites & Operational Notes

- Requires environment variables: `MSGRAPH_TENANT_ID`, `MSGRAPH_CLIENT_ID`, and `MSGRAPH_CLIENT_SECRET`.
- Microsoft Graph webhook subscriptions expire after 72 hours and require periodic maintenance via `maintain-subscriptions` (e.g., scheduled via cron or systemd timer).
- All operator actions are executed via the `hermes teams-pipeline` CLI surface.

## See also

[[MOC Skills]] · [[Zoth OS]]