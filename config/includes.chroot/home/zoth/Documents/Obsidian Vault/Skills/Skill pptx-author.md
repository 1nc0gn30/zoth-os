---
title: "pptx-author"
tags: [skill, hermes]
aliases: ["pptx-author"]
---

# pptx-author

- **Origin:** Hermes (Workstation skill, not a Zoth product; adapted from Anthropic)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/finance/pptx-author/SKILL.md`
- **Category:** Finance / Productivity

## Overview
`pptx-author` produces PowerPoint (`.pptx`) decks headless using `python-pptx`. Unlike general presentation tools, this skill provides a lightweight pattern specifically tailored for model-backed financial decks (such as pitch decks, IC memos, and earnings reports) where figures trace directly back to source workbooks.

## When to Load
Load when producing financial pitch decks or valuation materials as file artifacts on disk (`./out/<name>.pptx`). For general non-financial slideware, rich media, or speaker notes, use the standard `powerpoint` skill instead.

## Core Conventions & Patterns
- **Takeaway-Driven Headers**: Titles declare explicit takeaways rather than passive category labels.
- **Data Provenance**: Every financial figure traces programmatically back to workbook sheets and named ranges via `openpyxl`.
- **Branded Master Templates**: Loads local corporate templates (`./templates/firm-template.pptx`) when present.
- **Model-Rendered Charts**: Favors embedding PNG charts rendered directly from the financial model over fragile native PowerPoint chart widgets.
- **Headless Pipeline**: Runs completely locally in Python without requiring Microsoft Office or external service calls.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excel-author|excel-author]] · [[Skill powerpoint|powerpoint]]