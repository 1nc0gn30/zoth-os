---
title: "dogfood"
tags: [skill, hermes]
aliases: ["dogfood"]
---

# dogfood

A Hermes workstation skill for systematic exploratory QA testing of web applications.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`software-development/dogfood`), not a Zoth product. Authored by Teknium (`teknium1`) and ported to Hermes Agent.

## Purpose & Description

Guides systematic exploratory testing across web interfaces using browser automation toolsets. Navigates target web apps, tests interactive components, catches uncaught console exceptions, captures annotated screenshot evidence, and compiles structured bug reports.

### When to Load

- Performing exploratory QA testing, bug hunting, or quality audits on web applications.
- Verifying critical user flows (user registration, authentication, search, forms, checkout).
- Inspecting browser developer console streams for silent JavaScript runtime errors.
- Producing structured defect documentation with step-by-step reproduction instructions and visual proof.

### Five-Phase Workflow

1. **Plan:** Establishes output directories (`./dogfood-output/screenshots/`, `report.md`) and maps key user journeys and edge cases.
2. **Explore:** Navigates application URLs (`browser_navigate`), analyzes DOM layout (`browser_snapshot`), clears and monitors console output (`browser_console`), and interacts with elements via numbered visual refs (`browser_vision`, `browser_click`, `browser_type`).
3. **Collect Evidence:** Captures annotated screenshots and records console traces for every defect encountered.
4. **Isolate:** Re-tests failures with minimal steps to produce deterministic reproduction paths.
5. **Report:** Generates a structured summary document categorizing issues by severity (Critical, High, Medium, Low) with embedded screenshots and reproduction instructions.

## See also

[[MOC Skills]] · [[Zoth OS]]