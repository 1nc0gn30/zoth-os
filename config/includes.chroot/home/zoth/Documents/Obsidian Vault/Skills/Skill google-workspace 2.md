---
title: "google-workspace"
tags: [skill, hermes]
aliases: ["google-workspace"]
---

# google-workspace

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/productivity/google-workspace/SKILL.md`

## Overview

Integrates with Gmail, Google Calendar, Google Drive, Google Contacts, Google Sheets, and Google Docs. It operates through Hermes-managed OAuth2 credentials, preferring the `gws` CLI when installed and falling back to a bundled Python API client (`google_api.py`).

## When to Load

- Managing Google Workspace data: reading, searching, drafting, or sending emails in Gmail.
- Listing, creating, or deleting events on Google Calendar.
- Searching, uploading, downloading, sharing, or trashing files on Google Drive.
- Reading or appending structured data in Google Sheets and Google Docs.
- Generating a daily brief combining calendar schedule, conflict checks, and urgent messages.
- *Note:* If the user only requires email access, the `himalaya` skill with an App Password is recommended instead of full Google Cloud OAuth.

## Operation & Commands

- **Setup & Auth (`scripts/setup.py`):** Non-interactive OAuth2 token exchange with selectable service scopes (`email`, `calendar`, `drive`, `sheets`, `docs`, or `all`). Stores token at `~/.hermes/google_token.json`.
- **API CLI (`scripts/google_api.py`):** Exposes subcommands for `gmail` (search, get, send, reply), `calendar` (list, create, delete), `drive` (search, upload, download, share, delete), `contacts` (list), `sheets` (get, create, update, append), and `docs` (get, create, append).
- **Invariants:** Confirm actions with user before sending emails, deleting files, or mutating sheets/docs. All calendar timestamps require ISO 8601 with timezone offsets.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill himalaya|himalaya]]