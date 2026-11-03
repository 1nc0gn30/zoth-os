---
title: "lbo-model"
tags: [skill, hermes]
aliases: ["lbo-model"]
---

# lbo-model

`lbo-model` is a Hermes workstation skill adapted from Anthropic's Financial Services suite for constructing institutional-grade Leveraged Buyout (LBO) financial models in Excel (`.xlsx`) via headless `openpyxl`.

- **Origin:** Hermes workstation skill (Anthropic / Nous Research adaptation, not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/finance/lbo-model/SKILL.md`
- **Category:** Finance / Valuation
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Building private equity LBO models containing Sources & Uses, operating forecasts, debt schedules, and returns analysis.
- Evaluating buyout returns including Internal Rate of Return (IRR) and Multiple on Invested Capital (MOIC).
- Creating odd-dimensioned (5×5 or 7×7) valuation sensitivity tables centered symmetrically on base-case entry/exit multiples.
- Structuring debt waterfalls, cash sweeps, and interest calculations in Excel workbooks.

## Key Capabilities & Rules

- **Pure Formula Enforcement:** Never hardcodes calculated figures in Python; writes live Excel formula strings (`=SUM(...)`, `=B5*B6`) to preserve model dynamism.
- **Financial Color Conventions:** Adheres to banking font color codes—Blue (`#0000FF`) for hardcoded inputs, Black (`#000000`) for calculations, Purple (`#800080`) for same-sheet links, and Green (`#008000`) for cross-tab references.
- **Circularity Avoidance:** Computes interest on beginning debt balances rather than ending balances to eliminate circular reference errors during cash sweeps.
- **Formula Verification:** Recalculates and audits completed workbooks using the `excel-author` skill's `recalc.py` helper script prior to delivery.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excel-author|excel-author]] · [[Skill pptx-author|pptx-author]] · [[Skill dcf-model|dcf-model]] · [[Skill 3-statement-model|3-statement-model]]