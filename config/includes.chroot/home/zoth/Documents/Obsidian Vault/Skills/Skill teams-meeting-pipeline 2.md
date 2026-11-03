---
title: "teams-meeting-pipeline"
tags: [skill, hermes]
aliases: ["teams-meeting-pipeline"]
---

# teams-meeting-pipeline

Automates Microsoft Teams meeting transcription retrieval, summary generation, job replaying, and Microsoft Graph webhook subscription management.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/productivity/teams-meeting-pipeline/SKILL.md`
- **Prerequisites:** `MSGRAPH_TENANT_ID`, `MSGRAPH_CLIENT_ID`, and `MSGRAPH_CLIENT_SECRET` configured in `.env` with Azure AD admin consent.

## When to Load
Load this skill when summarizing Microsoft Teams meetings, extracting action items and notes from meeting recordings/transcripts, inspecting or replaying failed meeting jobs, or managing Microsoft Graph webhook subscriptions.

## CLI Subcommands (`hermes teams-pipeline`)
- `validate`: Audits pipeline configuration, Azure credentials, and environment parameters.
- `token-health [--force-refresh]`: Checks and refreshes Microsoft Graph OAuth token health.
- `list [--status failed]`: Displays recent meeting processing jobs or filters for failures.
- `show <job-id>` & `run <job-id>`: Inspects job metadata or triggers job replays to regenerate summaries.
- `fetch`: Tests transcript resolution using `--meeting-id` or `--join-web-url`.
- `subscriptions` & `maintain-subscriptions`: Lists active Graph webhooks and automates renewal.

> [!WARNING]
> Microsoft Graph webhook subscriptions expire after 72 hours. Set up recurring execution of `maintain-subscriptions` (via cron or systemd timer) to avoid silent ingestion drops.

## See also

[[MOC Skills]] · [[Zoth OS]]