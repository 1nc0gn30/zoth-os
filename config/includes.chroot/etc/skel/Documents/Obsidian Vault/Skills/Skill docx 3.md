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

Provides specialized CLI utilities in `scripts/` to manipulate Word `.docx` files programmatically. Supports formatted text runs, custom paragraph styles, table grids, embedded images, headers/footers, `{{token}}` templating, tracked revision management, reviewer comments, and package validation.

### When to Load

- Generating formatted Word documents (reports, documentation, contracts) from JSON schemas using `docx_create.py`.
- Reading full document text, heading hierarchy outlines, active styles, or embedded media via `docx_read.py`.
- Modifying existing `.docx` files: executing formatting-preserved find/replace, editing table cells, inserting or deleting paragraphs via `docx_edit.py`.
- Populating data templates with `{{tokens}}` using `docx_template.py`.
- Reviewing, accepting, or rejecting tracked revisions using `docx_revisions.py`.
- Listing, adding, or deleting anchored reviewer comments with `docx_comments.py`.
- Inserting dynamic Table of Contents (TOC) fields and "Page X of Y" page numbers into headers and footers.
- Performing document health checks and repair triage via `docx_validate.py`.
- *Limitations:* Does not edit legacy binary `.doc` or OpenDocument `.odt` files; PDF export requires external conversion engines such as LibreOffice.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pdf|pdf]] · [[Skill xlsx|xlsx]] · [[Skill powerpoint|powerpoint]]