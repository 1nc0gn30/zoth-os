---
title: "codebase-inspection"
tags: [skill, hermes]
aliases: ["codebase-inspection"]
---

# codebase-inspection

**codebase-inspection** is a Hermes workstation skill (not a Zoth product) for analyzing repository scale, language breakdowns, and code metrics via `pygount`.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/skills/software-development/codebase-inspection/SKILL.md`

### Core Capabilities

- **Code & Comment Metrics:** Calculates lines of executable code, comment density, documentation ratios, and file counts per programming language.
- **Dependency Exclusion:** Enforces directory skip flags (`--folders-to-skip`) for build artifacts and dependency trees (`.git`, `node_modules`, `venv`, `dist`, `build`) to prevent performance hangs.
- **Language Filtering:** Targets specific extensions using `--suffix` (e.g. counting only Python, YAML, or TypeScript).
- **Multiple Output Formats:** Generates human-readable summary tables, machine-readable JSON (`--format=json`), or sorted per-file line counts.
- **Pseudo-Language Classification:** Identifies empty files (`__empty__`), binaries (`__binary__`), auto-generated sources (`__generated__`), and duplicates (`__duplicate__`).

### When to Load

Load when assessing repo size, auditing technical composition, checking code-to-comment ratios, or performing architectural onboarding before large refactors.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill github|github]]