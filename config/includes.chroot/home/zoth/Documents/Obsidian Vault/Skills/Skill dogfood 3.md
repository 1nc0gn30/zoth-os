---
title: "dogfood"
tags: [skill, hermes]
aliases: ["dogfood"]
---

# dogfood

A Hermes workstation skill for exploratory QA testing of web applications using the `agent-browser` Rust engine.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`agent-browser/dogfood`), not a Zoth product. Uses direct invocations of the native `agent-browser` binary.

## Purpose & Description

Systematically tests web applications to uncover UI regressions, broken flows, and console bugs. Generates complete bug reports backed by visual evidence, annotated screenshots, and video recordings directly shareable with engineering teams.

### When to Load

- Asked to "dogfood", "QA", "exploratory test", "find issues", "bug hunt", or evaluate web application stability.
- End-to-end user journey verification across multi-step workflows.
- Auditing site responsiveness, interactive forms, edge cases, and client-side error logging.

### Workflow & Tool Execution

1. **Initialize:** Configures named sessions and output directories (`./dogfood-output/screenshots/`, `videos/`, `report.md`) via `agent-browser --session <name> open <url>`.
2. **Authenticate:** Interacts with login forms using interactive refs (`snapshot -i`, `fill @e1`, `click @e2`), saving authenticated cookies/storage state (`state save auth-state.json`).
3. **Orient:** Captures initial annotated screenshots (`screenshot --annotate initial.png`) to index navigation links and interactive controls.
4. **Explore:** Iterates across top-level views, interactive widgets, boundary condition inputs, and monitors console logs.
5. **Document & Wrap Up:** Logs defects with severity classifications, exact reproduction steps, annotated media evidence, and closes the browser session.

## See also

[[MOC Skills]] · [[Zoth OS]]