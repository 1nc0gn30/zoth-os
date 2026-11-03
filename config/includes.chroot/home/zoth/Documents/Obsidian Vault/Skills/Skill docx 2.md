---
title: "docx"
tags: [skill, hermes]
aliases: ["docx"]
---

# docx

A Hermes workstation skill to create, read, edit, template, and review Microsoft Word `.docx` documents.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`productivity/docx`), not a Zoth product. Authored by Nous Research and powered by `python-docx` CLI utilities.

## Purpose & Description

Provides CLI scripts in `scripts/` to manipulate Word `.docx` documents programmatically. Handles formatted text runs, typography styles, tables, embedded images, headers/footers, `{{token}}` variable templating, tracked changes, reviewer comments, and document integrity validation.

### When to Load

- Generating professional Word documents (contracts, reports, letters) from structured JSON specifications via `docx_create.py`.
- Extracting raw text, structural heading outlines, style inventories, or embedded images via `docx_read.py`.
- Modifying existing `.docx` files: text find-and-replace, updating table cells, inserting/deleting paragraphs, and merging runs via `docx_edit.py`.
- Populating Word templates containing `{{placeholder}}` fields via `docx_template.py`.
- Auditing tracked revisions (listing, accepting, or rejecting changes) via `docx_revisions.py`.
- Reading, adding, or removing anchored reviewer comments via `docx_comments.py`.
- Inserting dynamic Table of Contents (TOC) fields or "Page X of Y" page number footers.
- Diagnosing document corruption or structural defects via `docx_validate.py`.
- *Limitations:* Does not support legacy binary `.doc` or `.odt` formats; PDF export requires external conversion engines such as LibreOffice.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pdf|pdf]] · [[Skill xlsx|xlsx]] · [[Skill powerpoint|powerpoint]]