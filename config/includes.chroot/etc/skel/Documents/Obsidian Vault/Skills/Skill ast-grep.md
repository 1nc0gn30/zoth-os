---
title: "ast-grep"
tags: [skill, hermes]
aliases: ["ast-grep"]
---

# ast-grep

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/software-development/ast-grep/SKILL.md`

## Overview
The `ast-grep` skill provides AST-aware structural code search, linting, and automated rewrites across 25 programming languages using `ast-grep` (`sg`). It matches code structure and syntax trees rather than raw text bytes.

## When to Load
Load this skill when:
- Searching for structural code patterns (e.g., function signatures, specific imports, calls with particular arguments).
- Executing multi-file codemods and bulk syntax migrations (e.g., converting `require` to `import`, rewriting API calls).
- Identifying structural anti-patterns like empty catch blocks or unwanted type assertions.
- Running declarative YAML lint rules with automated fix capabilities.

## Workflow & Tooling
- **Entry Point**: Uses `scripts/ast_grep_helper.py`, a Python stdlib wrapper providing offline pattern validation and binary discovery.
- **Pattern Syntax**: Patterns are valid code snippets using `$VAR` (matches one AST node) and `$$$` (matches zero or more nodes), not regular expressions.
- **Safety Invariant**: Rewrites default to dry-run previews. Because `--update-all` and `--json` cannot run together in a single command, two-pass execution is used to preview matches before mutating files (`replace --apply`).
- **YAML Rule Engine**: Supports project-wide scans via `sg scan` with custom rules, constraints, relational matches, and auto-fixes.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill simplify-code|simplify-code]] · [[Skill systematic-debugging|systematic-debugging]]