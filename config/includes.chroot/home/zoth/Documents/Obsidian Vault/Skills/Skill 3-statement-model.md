---
title: "3-statement-model"
tags: [skill, hermes]
aliases: ["3-statement-model"]
---

# 3-Statement Financial Model

A workstation skill from Hermes (adapted from Anthropic's financial services suite) for populating integrated financial models linking Income Statement, Balance Sheet, and Cash Flow Statement in Excel workbooks.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/hermes-agent/optional-skills/finance/3-statement-model/SKILL.md`

## When to load
Load this skill when building or completing integrated corporate financial model templates using headless `openpyxl`:
- Populating historical financials and building multi-year projection periods.
- Constructing dynamic linkages between Income Statement (IS), Balance Sheet (BS), and Cash Flow Statement (CF).
- Calculating optional margin analysis (Gross, EBITDA, EBIT, Net Income) or credit/leverage metrics (Debt/EBITDA, Interest Coverage).
- Implementing scenario toggles (Base, Upside, Downside) using Excel formulas (`CHOOSE`, `INDEX/MATCH`).

## Key principles & validation
- **Formulas over hardcodes:** All projection cells, roll-forwards, and linkages must be Excel formula strings; only historicals and assumption drivers may contain raw numeric values.
- **Formatting conventions:** Follows a minimal blue/grey palette (dark blue headers, light blue column headers, grey/white inputs with blue font, black font formulas, green cross-tab links).
- **Core audit checks:** Requires continuous verification—Assets = Liabilities + Equity (= 0), CF ending cash matches BS cash (= 0), IS Net Income ties to CF starting Net Income (= 0), and Retained Earnings roll forward cleanly.
- **Data sourcing:** Prefers structured financial-data MCPs when configured, falling back to SEC EDGAR web search, company IR filings, or user data without fabrication.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excel-author|excel-author]] · [[Skill pptx-author|pptx-author]] · [[Skill dcf-model|dcf-model]] · [[Skill lbo-model|lbo-model]]