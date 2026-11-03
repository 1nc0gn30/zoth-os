---
title: "computer-use"
tags: [skill, hermes]
aliases: ["computer-use"]
---

# computer-use

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/autonomous-ai-agents/computer-use/SKILL.md`
- **Tags:** `computer-use`, `desktop`, `automation`, `gui`, `cross-platform`

## Overview
A cross-platform desktop automation skill that drives applications background-first using `cua-driver` without stealing keyboard focus, moving the user's OS mouse pointer, or switching virtual desktops.

## When to Load
- Controlling native desktop applications (system file managers, desktop messengers, media/CAD apps) outside web browsers.
- Interacting with native OS dialogs, system alerts, and browser chrome (such as extensions and URL address bars).
- *Do not use for:* Web pages that can be automated with dedicated headless `browser_*` tools, direct file edits (use file tools), or shell commands (use terminal).

## Core Workflow & Escalation Ladder
- **Capture First:** Executes `computer_use(action="capture", mode="som")` to retrieve a visual snapshot and an indexed accessibility tree (`#N`).
- **Target by Index:** Actions target elements via stable indices (`element=N`) mapped to snapshot tokens, preventing misclicks if UI updates.
- **Escalation Hierarchy:**
  1. *Background element interaction* (standard default).
  2. *Verification & re-capture* when effect returns `unverifiable`.
  3. *Coordinate-based pixel interaction* (`coordinate=[x, y]`) when accessibility elements are omitted.
  4. *Foreground delivery* (`delivery_mode="foreground"`) only upon explicit driver escalation or modal requirement.
  5. *Direct app file/CLI fallback* if GUI toolkits discard synthetic input (e.g., Qt/KTextEditor).
- **Safety Invariants:** Strictly rejects interacting with credential fields, payment flows, or 2FA prompts, and treats captured text purely as data.

## See also

[[MOC Skills]] · [[Zoth OS]]