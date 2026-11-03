---
title: "pdf"
tags: [skill, hermes]
aliases: ["pdf"]
---

# PDF Tooling & AcroForms
 
A workstation skill from Hermes for creating, manipulating, reading, filling, and securing PDF documents and interactive forms using `pypdf`, `reportlab`, and `pdfplumber`.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/skills/productivity/pdf/SKILL.md`

## When to load
Load this skill when an agent or workflow needs programmatic PDF operations:
- Generating formatted documents, reports, or invoices from structured JSON specifications.
- Building, linting, visually validating, or filling interactive AcroForm PDF forms.
- Extracting raw text, tabular data (to JSON/CSV), or metadata and field definitions.
- Merging multiple PDFs, splitting page ranges, rotating pages, or compressing content streams.
- Applying text or image stamps at precise coordinates, or overlaying watermark pages.
- Managing embedded file attachments and metadata (DocInfo), or encrypting/decrypting with AES-256.

## Key helper scripts & workflows
- **Document creation:** `pdf_create.py spec.json -o out.pdf` parses structured element blocks (`heading`, `paragraph`, `table`, `image`).
- **Form management:** `pdf_form_layout.py` lints field geometries and renders overlay debug PNGs; `pdf_make_form.py` builds fillable AcroForms; `pdf_fill_form.py` populates fields from JSON and optionally flattens widgets.
- **Extraction:** `pdf_read.py` extracts per-page text (`--text`), tabular data (`--tables`), document metadata (`--meta`), or field definitions (`--fields`).
- **Manipulation & security:** `pdf_merge.py` concatenates documents with outline bookmarks; `pdf_split.py` handles subset extraction and rotation; `pdf_stamp.py` places dynamic text/images; `pdf_secure.py` applies or removes AES-256 encryption.
- **Rasterization:** `pdf_page_image.py` exports pages as PNGs (using `pypdfium2` or `pdftoppm`) for visual review or downstream OCR.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill docx|docx]] · [[Skill xlsx|xlsx]] · [[Skill powerpoint|powerpoint]]