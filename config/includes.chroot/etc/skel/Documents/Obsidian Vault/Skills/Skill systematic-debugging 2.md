---
title: "systematic-debugging"
tags: [skill, hermes]
aliases: ["systematic-debugging"]
---

# systematic-debugging

Disciplined four-phase root-cause investigation framework enforcing verification before attempting bug fixes.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/skills/software-development/systematic-debugging/SKILL.md`
- **Author/Attribution:** Hermes Agent (adapted from `obra/superpowers`)

## When to Load
Load this skill for any technical failure (failing unit/integration tests, production regressions, unexpected behavior, build breaks, or performance degradation), especially when rushed, after multiple failed quick-fixes, or when root cause is unclear.

## The Four Phases
1. **Root Cause Investigation:** Thoroughly read error traces, construct a tight reproducible feedback loop that fails red on the exact symptom, review recent git history, and trace data flow upstream to the source.
2. **Pattern Analysis:** Minimize the repro to the smallest necessary state, locate known-working patterns in the codebase, and enumerate all structural differences.
3. **Hypothesis and Testing:** Formulate 3–5 ranked, falsifiable hypotheses. Probe one variable at a time using minimal test cases or uniquely tagged debug logs (`[DEBUG-xxx]`).
4. **Implementation:** Write a failing test case first (TDD), apply the single isolated fix at the root cause, and confirm zero test regressions.

> [!IMPORTANT]
> **The Rule of Three:** If three attempted fixes fail, halt further patches and question fundamental architectural assumptions.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill test-driven-development|test-driven-development]] · [[Skill subagent-driven-development|subagent-driven-development]]