---
title: "docx"
tags: [skill, grok]
aliases: ["docx"]
---

# docx

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/docx/SKILL.md`)
- **When to load:** Load whenever creating, reading, editing, or modifying Word documents (`.docx` or `.dotx`). Triggered by requests for Word documents, reports, templates, memos, tracked changes, or Word-specific formatting. (Do not load for PDFs, spreadsheets, or Google Docs).

## Overview & Core Capabilities

`docx` provides comprehensive tooling and engineering rules for programmatically generating new Word files via JavaScript (`docx-js`) and surgical XML modification of existing documents and templates.

## Workflows & Methodologies

1. **Creating Documents from Scratch:**
   - Uses `docx` (`npm install -g docx`) to assemble documents in memory and pack to buffer.
   - Enforces explicit page sizing in DXA units (e.g., US Letter: 12,240 × 15,840 DXA; 1440 DXA = 1 inch).
   - Requires dual-width definitions for tables (`columnWidths` on `Table` plus matching `width` on each `TableCell`).
   - Uses formal list numbering (`LevelFormat.BULLET`/`DECIMAL`) instead of raw Unicode bullet characters.
   - Preserves image aspect ratios in `ImageRun` and supplies raster fallbacks for SVG drawings.

2. **Template Editing & Unpacking:**
   - Unpacks `.docx`/`.dotx` ZIP containers into XML trees using `scripts/office/unpack.py`.
   - Modifies XML content using dedicated helper scripts (`replace_text.py`, `replace_field.py`, `delete_sections.py`, `comment.py`).
   - Preserves XML typography entities for smart quotes (`&#x201C;`, `&#x201D;`).
   - Repacks and validates XML structures using `scripts/office/pack.py`.

3. **Tracked Changes & Tool Integrations:**
   - Inserts schema-compliant `<w:ins>` and `<w:del>` elements with author attribution (defaulting to "Grok").
   - Integrates with `pandoc` for markdown text extraction, LibreOffice (`soffice.py`) for headless conversion or accepting changes, and Poppler (`pdftoppm`) for page rendering.

## See also

[[MOC Skills]] · [[Zoth OS]]