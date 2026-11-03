---
title: "pdf"
tags: [skill, grok]
aliases: ["pdf"]
---

# pdf

Comprehensive toolkit and recipes for reading, generating, transforming, and filling PDF documents.

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/pdf`)
- **When to load:** Tool-driven; activates automatically whenever a task takes a `.pdf` file as input or produces a PDF deliverable.

## Tooling Ecosystem

- **Python Libraries:** `pypdf` (manipulation/merge/split), `pdfplumber` (text and tabular data extraction), `reportlab` (flowable and absolute PDF generation), `pdf2image` & `pytesseract` (rasterization and OCR).
- **CLI Utilities:** `poppler-utils` (`pdftotext`, `pdfimages`, `pdftoppm`) and `qpdf` (fast transformation and structural repair).

## Core Capabilities & Recipes

- **Content Extraction:** Extract plain text via `pdfplumber` or `pdftotext -layout`. Extract structured tabular grids directly into pandas DataFrames via `extract_tables()`.
- **Image Extraction vs. Rasterization:** Differentiates between extracting raw embedded bitmaps (`pdfimages -all`) versus rendering whole page layouts (`pdftoppm -png -r 300`).
- **Scanned OCR:** Identifies image-only scans and routes pages through `pdf2image` and Tesseract OCR.
- **Document Manipulation:** Merges, splits, rotates, watermarks, encrypts, and decrypts documents using `pypdf` or `qpdf`.
- **Form Filling:** Supports inspecting and populating interactive AcroForm fields, with specialized procedures for official tax forms (`forms.md`, `tax.md`).

## See also

[[MOC Skills]] · [[Zoth OS]]