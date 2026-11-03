---
title: "dcf-model"
tags: [skill, hermes]
aliases: ["dcf-model"]
---

# dcf-model

- **Origin:** Hermes skill (workstation skill, not a Zoth product; adapted from Anthropic's financial-services suite)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/finance/dcf-model/SKILL.md`
- **Tags:** `finance`, `valuation`, `dcf`, `excel`, `openpyxl`, `modeling`, `investment-banking`

## Overview
An institutional-grade equity valuation skill for building Discounted Cash Flow (DCF) financial models in Excel (`.xlsx`) using headless `openpyxl`.

## When to Load
- Performing intrinsic valuation of public or private companies based on projected unlevered free cash flows.
- Constructing multi-scenario financial forecasts (Bear, Base, Bull cases) with automated scenario switches.
- Calculating Cost of Capital (WACC) via CAPM and building 5×5 valuation sensitivity grids.

## Model Structure & Standards
- **Two-Sheet Layout:**
  - **`DCF` Sheet:** Historical financial analysis, revenue and OpEx projections, unlevered FCF build (NOPAT, D&A, CapEx, ΔNWC), enterprise-to-equity bridge, and 3 sensitivity tables.
  - **`WACC` Sheet:** CAPM cost of equity, after-tax cost of debt, and capital structure weighting.
- **Formula Integrity:** Strict prohibition on Python pre-computation for projections; all PVs, discount factors, and sensitivities use dynamic Excel formulas.
- **Scenario & Consolidation Architecture:** Organized Bear/Base/Bull assumption blocks linked to projection rows via consolidated `INDEX` formulas.
- **Sensitivity Grids:** Symmetrical 5×5 tables (WACC vs. Terminal Growth, Growth vs. Margin) with centered and highlighted base case cells, programmatically populated and audited via `recalc.py`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excel-author|excel-author]] · [[Skill pptx-author|pptx-author]] · [[Skill comps-analysis|comps-analysis]] · [[Skill lbo-model|lbo-model]] · [[Skill 3-statement-model|3-statement-model]]