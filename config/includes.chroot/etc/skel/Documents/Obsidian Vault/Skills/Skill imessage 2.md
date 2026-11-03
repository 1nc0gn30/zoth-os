---
title: "imessage"
tags: [skill, hermes]
aliases: ["imessage"]
---

# imessage

macOS iMessage and SMS integration via the `imsg` command-line utility.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/apple/imessage/SKILL.md`
- **Platform:** macOS only
- **Prerequisites:** `imsg` CLI (`brew install steipete/tap/imsg`), Full Disk Access, and Messages.app automation permissions.

## Purpose & Overview

The `imessage` skill allows Hermes to inspect conversations, monitor incoming chats, and dispatch text messages or media attachments through native macOS Messages.app using the `imsg` tool.

## When to Load

- Reading conversation history or listing recent active threads from Messages.app.
- Dispatching iMessage or SMS messages to phone numbers or Apple ID emails.
- Attaching images or local files to outgoing text messages.
- Streaming or watching for incoming messages on designated chat IDs.

## Core Commands

- `imsg chats --limit 10 --json`: Lists active chats and contact metadata in JSON format.
- `imsg history --chat-id <id> --limit 20 --json`: Fetches recent message history for a specific chat.
- `imsg send --to "<recipient>" --text "<message>"`: Sends a text message via Messages.app (supports `--service imessage|sms|auto`).
- `imsg watch --chat-id <id> --attachments`: Listens for new incoming messages and file attachments in real time.

## Safety Guidelines

- Always verify the intended recipient and message content with the operator before sending.
- Never dispatch messages to unverified or unknown numbers without explicit user confirmation.

## See also

[[MOC Skills]] · [[Zoth OS]]