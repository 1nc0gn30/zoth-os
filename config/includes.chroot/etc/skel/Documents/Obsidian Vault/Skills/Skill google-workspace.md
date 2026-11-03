---
title: "google-workspace"
tags: [skill, hermes]
aliases: ["google-workspace"]
---

# google-workspace

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/productivity/google-workspace/SKILL.md`

## Overview

Provides access to Gmail, Google Calendar, Google Drive, Google Contacts, Google Sheets, and Google Docs. Uses Hermes-managed OAuth2 credentials, executing operations through the `gws` CLI when available or via a local Python client (`google_api.py`).

## When to Load

- Reading, searching, replying to, or sending emails in Gmail.
- Querying upcoming calendar events, scheduling meetings, or removing entries.
- Uploading, downloading, searching, sharing, or deleting files in Google Drive.
- Reading cells, updating tables, or appending rows to Google Sheets.
- Reading text or appending sections to Google Docs documents.
- Generating daily briefs or meeting preparations combining schedule and unread emails.
- *Note:* If the user only requires email functionality, prefer the `himalaya` skill with an App Password.

## Operation & Commands

- **Authentication (`scripts/setup.py`):** Authorizes through a desktop OAuth client JSON file; supports scoped permissions (`email`, `calendar`, `drive`, `sheets`, `docs`, or `all`). Stores credentials at `~/.hermes/google_token.json`.
- **Command CLI (`scripts/google_api.py`):** Outputs JSON for `gmail`, `calendar`, `drive`, `contacts`, `sheets`, and `docs` workflows.
- **Key Safety Guardrails:** Always require explicit user confirmation before sending emails, deleting Drive files, creating calendar events, or altering Docs and Sheets. Requires ISO 8601 timestamps with explicit timezones for calendar entries.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill himalaya|himalaya]]