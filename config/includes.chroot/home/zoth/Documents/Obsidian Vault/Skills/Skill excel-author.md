---
title: "excel-author"
tags: [skill, hermes]
aliases: ["excel-author"]
---

# excel-author

Builds banker-grade, auditable financial workbooks headless in Python using `openpyxl`, enforcing strict modeling conventions, live dynamic formulas, cell color hierarchies, and balance checks.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/finance/excel-author/SKILL.md`
- **Dependencies:** `openpyxl>=3.0`
- **Tags:** excel, openpyxl, finance, spreadsheet, modeling

## When to Load

Load when generating `.xlsx` models from scratch (DCFs, 3-statement models, LBOs, comps analyses, sensitivity tables) without a live Microsoft Office desktop instance. Do not use for flat CSV/tabular data dumps or interactive dashboards requiring BI tools.

## Core Modeling Standards

- **Color Coding:** Blue (`0000FF`) for human-entered inputs and growth drivers, Black for live formulas, and Green (`006100`) for cross-sheet references.
- **Formulas Over Hardcodes:** Calculation cells must use Excel formulas (e.g. `=D19*(1+$B$8)`), never values precomputed in Python.
- **Sourcing Comments:** Every hardcoded cell requires an inline `Comment` stating the exact source document, page, and date.
- **Verification Tab:** Includes a dedicated `Checks` worksheet verifying that the balance sheet balances (`Assets = Liabilities + Equity`) and cash flows reconcile.
- **Sensitivity Tables:** Uses odd-dimension matrices (5×5 or 7×7) where the center cell exactly matches the base-case assumption and highlighted in medium blue.
- **Formula Recalculation:** Advises running headless LibreOffice or Python recalculation helpers before delivery when downstream consumers require precomputed cell values.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill xlsx|xlsx]] · [[Skill pptx-author|pptx-author]] · [[Skill dcf-model|dcf-model]] · [[Skill comps-analysis|comps-analysis]] · [[Skill lbo-model|lbo-model]] · [[Skill 3-statement-model|3-statement-model]]