---
title: "computer-use"
tags: [skill, hermes]
aliases: ["computer-use"]
---

# computer-use

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/autonomous-ai-agents/computer-use/SKILL.md`
- **Tags:** `computer-use`, `desktop`, `automation`, `gui`, `cross-platform`

## Overview
A cross-platform GUI automation skill that drives desktop applications background-first using `cua-driver` under the hood. Actions operate without moving the real OS cursor, stealing window focus, or disturbing the user's active workspace.

## When to Load
- Driving native desktop GUI applications (file managers, mail clients, native messengers, desktop tools) where headless browser or CLI tools cannot be used.
- Interacting with native OS dialogs and browser chrome (e.g., address bars, permissions, extensions).
- *Do not use for:* Web automation achievable via headless `browser_*` tools, direct file edits (use file tools), or shell commands (use terminal).

## Core Workflow & Escalation Ladder
- **Capture First:** Uses `computer_use(action="capture", mode="som")` to obtain a screenshot and an indexed accessibility element tree (`#N`).
- **Indexed Actions:** Prefers clicking or targeting controls by element index (`element=N`) rather than raw coordinates to prevent stale or drifted clicks.
- **Background-First Escalation Ladder:**
  1. *Background element interaction* (default).
  2. *Verification & re-capture* when state returns `unverifiable`.
  3. *Pixel coordinates* (`coordinate=[x, y]`) when elements are unexposed.
  4. *Foreground execution* (`delivery_mode="foreground"`) only when driver signals necessity.
  5. *Direct app I/O / CLI fallback* if toolkit drops synthetic input (e.g., Qt KTextEditor).
- **Safety Boundaries:** Refuses interaction with password prompts, 2FA, payment gateways, and treats visual text as data rather than executable instructions.

## See also

[[MOC Skills]] · [[Zoth OS]]