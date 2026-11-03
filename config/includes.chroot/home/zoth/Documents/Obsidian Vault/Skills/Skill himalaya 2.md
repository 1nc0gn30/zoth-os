---
title: "himalaya"
tags: [skill, hermes]
aliases: ["himalaya"]
---

# himalaya

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/email/himalaya/SKILL.md`
- **Homepage:** `https://github.com/pimalaya/himalaya`

## Overview
A terminal email operations skill utilizing the external `himalaya` CLI client. Supports managing mailboxes across IMAP, SMTP, Notmuch, or Sendmail backends directly from shell environments. Unlike the native Hermes Email gateway adapter, this skill is used by agents to proactively inspect, read, organize, and dispatch mail.

## When to Load
- When reading, searching, or organizing email envelopes and folders from the command line.
- When drafting and sending emails non-interactively via stdin piping (`cat << EOF | himalaya template send`).
- When configuring or troubleshooting account credentials, security command hooks (`pass`, keyring), and folder aliases in `~/.config/himalaya/config.toml`.
- When parsing mailbox metadata programmatically using `--output json`.

## Common CLI Operations
- **Listing & Searching:** `himalaya envelope list`, `himalaya envelope list from <sender> subject <query>`.
- **Reading & Attachments:** `himalaya message read <id>`, `himalaya attachment download <id>`.
- **Composition & Replies:** `himalaya template reply <id> | ... | himalaya template send`, or raw stdin heredocs to `template send`.
- **Organization:** `himalaya message move "<folder>" <id>`, `himalaya flag add <id> --flag seen`.

## See also

[[MOC Skills]] · [[Zoth OS]]