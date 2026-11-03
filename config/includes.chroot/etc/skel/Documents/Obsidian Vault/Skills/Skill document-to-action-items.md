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

Extracts actionable tasks, explicit commitments, and formal deadlines from raw documents while preserving strict source provenance (file name, page number, and section coordinates). Integrates with underlying extraction skills (`pdf`, `docx`) to turn unstructured narratives into verifiable obligations.

### When to Load

- Extracting binding deadlines, payment schedules, and obligations from legal agreements or contracts.
- Turning narrative reports, audit findings, or meeting documentation into actionable task lists.
- Processing scanned paperwork or OCR files while maintaining visibility into low-confidence text segments.
- Identifying risks, assigned owners, dependencies, and follow-up milestones across document sets.
- *Do not load* for simple text extraction with no downstream structuring needs (use `pdf` or `docx` directly).

### Workflow & Invariants

1. **Inventory & Provenance:** Establishes file versions and extracts content with precise page and section citations.
2. **Evidence Classification:** Categorizes parties, deadlines, financial amounts, obligations, and exceptions while strictly preserving modal nuances ("may", "should", "must").
3. **Internal Consistency Check:** Reconciles internal dates, financial totals, and cross-references.
4. **Action Proposal:** Generates clear tasks citing source passages; unknown dates and owners remain explicitly unresolved.
5. **Pre-Write Review:** Requires user verification prior to writing records to external trackers or project systems.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pdf|pdf]] · [[Skill docx|docx]] · [[Skill notion|notion]]