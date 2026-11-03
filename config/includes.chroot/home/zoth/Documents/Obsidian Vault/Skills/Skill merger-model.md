---
title: "merger-model"
tags: [skill, hermes]
aliases: ["merger-model"]
---

# merger-model

Build M&A accretion/dilution workbooks in Excel.

- **Origin:** Hermes skill (workstation skill, not a Zoth product; adapted from Anthropic)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/finance/merger-model/SKILL.md`

## Overview & When to Load

Load when modeling M&A transactions, building accretion/dilution analyses, evaluating acquisition targets, or preparing pitch book merger consequences.

## Workflow & Model Structure

- **Environment:** Generates headless `.xlsx` workbooks using `openpyxl` following `excel-author` formatting and recalculation conventions.
- **Seven-Stage Modeling Process:**
  1. **Inputs:** Captures acquirer and target financials (share price, EPS, debt, tax rates) and deal terms (offer price, consideration mix, financing fees, expected close date).
  2. **Purchase Price Analysis:** Computes offer premiums, equity and enterprise values, and implied EV/EBITDA and P/E multiples.
  3. **Sources & Uses:** Balances new debt, cash on hand, and new equity against purchase price, target debt refinancing, and advisory/financing fees.
  4. **Pro Forma EPS:** Projects Year 1–3 pro forma net income, adjusting for post-tax synergies, foregone interest on cash, debt interest, and intangible amortization.
  5. **Sensitivity Tables:** Matrixes EPS accretion/dilution across synergy levels versus offer premiums, as well as cash-to-stock consideration ratios.
  6. **Breakeven Synergies:** Determines minimum required synergies for Year 1 EPS neutrality.
  7. **Deliverables:** Produces a structured multi-tab workbook and a one-page pitch summary.
- **Data Integrity:** Prefers financial MCPs or SEC EDGAR filings via web tools; never fabricates financial data, labeling unverified values as `[UNSOURCED]`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excel-author|excel-author]] · [[Skill pptx-author|pptx-author]] · [[Skill dcf-model|dcf-model]] · [[Skill 3-statement-model|3-statement-model]]