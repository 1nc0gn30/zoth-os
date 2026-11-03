---
title: "comps-analysis"
tags: [skill, hermes]
aliases: ["comps-analysis"]
---

# comps-analysis

- **Origin:** Hermes skill (workstation skill, not a Zoth product; adapted from Anthropic's financial-services suite)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/finance/comps-analysis/SKILL.md`
- **Tags:** `finance`, `valuation`, `comps`, `excel`, `openpyxl`, `modeling`, `investment-banking`

## Overview
A financial modeling skill for generating institutional-grade comparable company valuation workbooks in Excel (`.xlsx`) using headless `openpyxl`.

## When to Load
- Constructing peer valuation and operating benchmark models for M&A, investment decisions, or equity research.
- Generating financial comparison tables with operating metrics (Revenue, Gross Margin, EBITDA Margin) and valuation multiples (EV/Revenue, EV/EBITDA, P/E).
- Performing statistical distribution benchmarking (Max, 75th percentile, Median, 25th percentile, Min).

## Key Principles & Conventions
- **Formula Integrity:** Every calculated metric must use live Excel formulas referencing input cells rather than pasted values. Only raw inputs are hardcoded.
- **Source Auditability:** Every hardcoded cell requires an attached comment citing the exact source (e.g. SEC EDGAR filing, IR release) or assumption. Missing metrics are labeled `[UNSOURCED]` rather than hallucinated.
- **Data Priority:** Structured financial MCP data sources take precedence if configured; otherwise falls back to SEC EDGAR, company IR pages, and web extraction.
- **Workbook Architecture:** Pairs with `excel-author` conventions for styling (restrained blue/grey palette, uniform column widths) and headless recalculation via `recalc.py`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excel-author|excel-author]] · [[Skill pptx-author|pptx-author]] · [[Skill dcf-model|dcf-model]] · [[Skill lbo-model|lbo-model]]