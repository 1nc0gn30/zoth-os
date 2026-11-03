---
title: "browser-harness"
tags: [skill, hermes]
aliases: ["browser-harness"]
---

# browser-harness

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/installs/76fe6b73b96f244c/environments/5a818c3999ea454aad33be2b0a27247e/venv/lib/python3.14/site-packages/browser_harness/SKILL.md`

## Overview
`browser-harness` provides direct browser automation and control via the Chrome DevTools Protocol (CDP). It allows agents to interact with real browser sessions, navigate complex web applications, and inspect pages using accessibility trees and coordinate-based interactions.

## When to Load
Load this skill when:
- Interacting with pages that require user actions (clicking, typing, form submissions, navigation).
- Accessing authenticated/logged-in user sessions, JavaScript-rendered dynamic pages, or bot-protected sites.
- Performing visual tasks requiring screen capture, multi-tab automation, or background tab control.

**When NOT to load:** Do not use for plain HTTP fetches of public pages or documentation; use `curl` or basic fetch tools instead.

## Key Features & Architecture
- **CDP Daemon Architecture**: Connects to a local Chrome instance (`chrome://inspect/#remote-debugging`) or Browser Use cloud instances for isolated concurrent execution.
- **Accessibility-First Interaction**: Locates interactive elements via the accessibility tree (`Accessibility.getFullAXTree`) and calculates box model centers for reliable coordinate clicks (`click_at_xy`).
- **Tab & Session Management**: Reuses working tabs (`current_tab()`, `switch_tab()`, `new_tab()`) without disrupting Chrome's visible UI unless explicit activation is needed.
- **Diagnostics & Tooling**: Built-in environment checking via `browser-harness --doctor`, session recording (`start_recording()`, `stop_recording()`), and optional domain skills (`BH_DOMAIN_SKILLS=1`).

## See also

[[MOC Skills]] · [[Zoth OS]]