---
title: "unbroker"
tags: [skill, hermes]
aliases: ["unbroker"]
---

# unbroker

Autonomous identification and removal of exposed personal information from data brokers and people-search sites.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/security/unbroker/SKILL.md`
- **Engine Script:** `scripts/pdd.py` (stores deterministic dossiers and ledgers under `~/.hermes/unbroker/`)

## Overview & When to Load

Load this skill to discover and remove exposed personal information (names, addresses, phone numbers, emails, relatives) from data brokers:
- Executing privacy opt-out and legal removal requests (CCPA, GDPR, opt-out forms, email deletion demands).
- Post-doxxing digital footprint remediation and recurring privacy monitoring.
- Managing multi-subject dossiers with explicit recorded consent and strict disclosure safeguards.

## Architecture & Workflow

- **Autonomous Loop:** Driven by `python scripts/pdd.py next <subject>` in a hands-off loop until all possible removals are executed, surfacing only hard CAPTCHAs, ID requests, or phone confirmations in a single final human task digest (`pdd tasks`).
- **Two-Phase Operation:**
  - *Phase 1 (Discover):* Probes broker sites via `web_extract` / browser tools, recording exposure states in the ledger.
  - *Phase 2 (Opt-Out):* Processes ownership clusters parents-first, dispatches opt-out emails (via local SMTP or browser webmail mode), and polls verification links over IMAP (`poll-verification`).
- **State Registry Lever:** Leverages centralized opt-out mechanisms like the California DELETE Act / DROP registry (`pdd drop`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill google-workspace|google-workspace]] · [[Skill agentmail|agentmail]] · [[Skill himalaya|himalaya]] · [[Skill scrapling|scrapling]] · [[Skill osint-investigation|osint-investigation]]