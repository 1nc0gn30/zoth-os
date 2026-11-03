---
title: "xlsx"
tags: [skill, hermes]
aliases: ["xlsx"]
---

# xlsx

> **Workstation Skill (Hermes)** — Origin: Hermes skill (workstation skill, not a Zoth product).

A spreadsheet manipulation workstation skill for creating, reading, editing, and restructuring Excel `.xlsx` workbooks and CSV files using Python and `openpyxl`.

### Helper Scripts & Capabilities
- **Creation (`xlsx_create.py`):** Generates styled multi-sheet workbooks from JSON specifications, including formulas, freeze panes, conditional formats, charts, data validation, and native tables.
- **Inspection (`xlsx_read.py`):** Inspects sheet metadata, dimensions, cell notes, defined names, and dumps contents to JSON or CSV.
- **In-Place Editing (`xlsx_edit.py`):** Updates specific cells, appends table records, and manages sheet duplication or renaming.
- **Reference-Aware Restructuring (`xlsx_restructure.py`):** Inserts or deletes rows and columns while updating formula references across all sheets.
- **Headless Recalculation (`xlsx_recalc.py`):** Evaluates formulas via LibreOffice (`soffice`) since `openpyxl` does not compute formula values natively.
- **CSV Interoperability (`csv_to_xlsx.py`, `xlsx_to_csv.py`):** Performs bidirectional conversion with automatic type inference and custom encoding support.

### When to Load
- Programmatically generating financial, operational, or tabular Excel reports.
- Inspecting, parsing, or altering `.xlsx` workbooks without running an interactive GUI.
- Converting between structured CSVs and styled Excel sheets.

- **Author / License:** Nous Research · MIT License
- **Platforms:** Linux, macOS, Windows
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/productivity/xlsx/SKILL.md`

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill docx|docx]] · [[Skill pdf|pdf]] · [[Skill powerpoint|powerpoint]]