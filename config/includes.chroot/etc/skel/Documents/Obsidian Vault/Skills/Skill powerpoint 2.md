---
title: "powerpoint"
tags: [skill, hermes]
aliases: ["powerpoint"]
---

# powerpoint

- **Origin:** Hermes (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/productivity/powerpoint/SKILL.md`
- **Category:** Productivity

## Overview
`powerpoint` enables creating, inspecting, editing, and rendering PowerPoint presentations (`.pptx`) completely offline using `python-pptx`, without requiring Microsoft PowerPoint or Office installations.

## When to Load
Use when generating slide decks, reports, or pitch decks from JSON specs; extracting text, speaker notes, tables, charts, or images from `.pptx` files; editing existing decks (replacing text, updating chart data, reordering or duplicating slides); or populating branded corporate templates. (Convert legacy `.ppt` files via LibreOffice first).

## Key Tooling & Scripts
Includes command-line Python utilities in `scripts/`:
- `pptx_create.py`: Builds decks from structured JSON specifications (supporting custom layouts, bullet styles, tables, charts, shapes, and notes).
- `pptx_read.py`: Outputs structured JSON deck outlines (`--outline`), dumps speaker notes (`--notes`), or extracts embedded images (`--images`).
- `pptx_edit.py`: Performs in-place edits including text replacement across shapes/tables, chart dataset updates, slide reordering, independent slide duplication, and footer/hyperlink configuration.
- `pptx_from_template.py`: Replaces `{{token}}` variables across slides, tables, and notes within branded corporate templates.
- `pptx_render.py`: Converts decks to PDF and slide PNG images via headless LibreOffice and `pdftoppm` for visual review.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill docx|docx]] · [[Skill xlsx|xlsx]] · [[Skill pdf|pdf]]