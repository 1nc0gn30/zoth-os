---
title: "dogfood"
tags: [skill, hermes]
aliases: ["dogfood"]
---

# dogfood

Exploratory QA testing skill for web applications, focused on identifying defects, capturing visual/console evidence, and generating structured bug reports.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/software-development/dogfood/SKILL.md`
- **Author:** Teknium (teknium1), Hermes Agent

## When to Load
Load this skill when tasked with performing automated or exploratory QA testing on a web application, verifying user flows, auditing front-end stability, or generating comprehensive issue reports with reproducible evidence.

## Prerequisites & Toolset
Requires the Hermes browser toolset:
- Navigation & Interaction: `browser_navigate`, `browser_click`, `browser_type`, `browser_press`, `browser_scroll`, `browser_back`
- Inspection & Evidence: `browser_snapshot`, `browser_console`, `browser_vision`

## 5-Phase QA Workflow
1. **Plan:** Establish the output directory (`./dogfood-output/`), parse the target URL and user scope, and map key user flows and interactive surfaces.
2. **Explore:** Navigate routes, inspect accessibility/DOM snapshots, clear and monitor console errors, and execute interaction passes.
3. **Collect Evidence:** Capture annotated screenshots via `browser_vision`, log reproduction steps, and record expected vs. actual outcomes.
4. **Categorize:** Deduplicate issues, assign severities (Critical, High, Medium, Low), and sort across functional, visual, accessibility, console, or UX categories.
5. **Report:** Compile `{output_dir}/report.md` with an executive summary, issue breakdown table, and screenshot media references.

## See also

[[MOC Skills]] · [[Zoth OS]]