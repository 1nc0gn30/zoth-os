---
title: "agentmail"
tags: [skill, hermes]
aliases: ["agentmail"]
---

# AgentMail

A workstation skill from Hermes for managing agent-owned email inboxes, handling OTP verification flows, sending outbound messages, and listening for inbound mail.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/email/agentmail/SKILL.md`

## When to load
Load this skill when an autonomous agent requires dedicated email capabilities:
- Generating and provisioning an agent-owned email inbox (distinct from personal IMAP/SMTP mailboxes).
- Automating email-based OTP signups, account verifications, and confirmations.
- Sending, reading, replying to, forwarding, and tagging email threads with attachments.
- Subscribing to real-time inbound mail notifications via webhooks or WebSockets.

## Key commands & operations
- **CLI setup:** Installed via `npm install -g agentmail-cli@latest` and authenticated by setting `AGENTMAIL_API_KEY=am_...`.
- **JSON structured output:** Uses `agentmail inboxes list --format json` to programmatically extract inbox IDs and metadata for agent tasks.
- **Workflow priorities:** Prefers the official `agentmail` CLI first, falling back to MCP tools or the direct REST API only if a specific command is unsupported.
- **Security & LLM parsing:** Never leaks API keys in logs or prompts, uses stable client IDs for idempotency, and prefers `extracted_text` or `extracted_html` fields for model context.

## See also

[[MOC Skills]] · [[Zoth OS]]