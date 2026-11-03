---
title: "document-to-action-items"
tags: [skill, hermes]
aliases: ["document-to-action-items"]
---

# document-to-action-items

A Hermes workstation skill for extracting cited obligations, deadlines, and tasks from contracts, reports, and unstructured documents.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`productivity/document-to-action-items`), not a Zoth product. Authored by Ben Barclay and ported to Hermes Agent.

## Purpose & Description

Extracts actionable tasks, explicit commitments, and formal deadlines from raw documents while preserving source provenance (file, page, section coordinates). Coordinates with underlying document extraction skills (`pdf`, `docx`) to structure obligations without making legal determinations.

### When to Load

- Extracting binding deadlines, payment schedules, and obligations from vendor agreements or contracts.
- Converting operational reports, audit findings, or project specifications into concrete task lists.
- Processing scanned forms or OCR documents to extract structured data while preserving OCR confidence markers.
- Identifying project risks, explicit owners, exceptions, and follow-ups across document corpora.
- *Do not load* for basic raw text extraction where no downstream structuring is required (load `pdf` or `docx` directly).

### Workflow & Invariants

1. **Inventory & Extraction:** Identifies authoritative versions and extracts text/tables with strict source coordinates.
2. **Evidence Classification:** Categorizes entities, dates, obligations vs prohibitions, and distinguishes modalities ("may", "should", "must").
3. **Internal Validation:** Cross-checks dates, sums, and terminology across pages before synthesis.
4. **Action Item Generation:** Maps obligations to explicit owners, due dates, dependencies, and source citations; unresolved fields are left explicitly unset rather than guessed.
5. **Human Approval:** Requires user confirmation before committing any tasks to external platforms (Notion, spreadsheets).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pdf|pdf]] · [[Skill docx|docx]] · [[Skill notion|notion]]