---
title: "spike"
tags: [skill, hermes]
aliases: ["spike"]
---

# spike

Throwaway experiments to validate an idea, test feasibility, or compare approaches before committing to a full build.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/software-development/spike/SKILL.md`
- **Author/Attribution:** Hermes Agent (adapted from GSD `gsd-build/get-shit-done`)

## When to Load
Load this skill when exploring unvalidated ideas, checking technical feasibility, comparing two competing libraries or architectures, or surfacing unknowns before writing production code. Do not use it if the answer is already documented or if work is already on the production path.

## Core Workflow
1. **Decompose:** Break the idea into 2–5 independent feasibility questions framed as Given/When/Then statements, ordered by risk.
2. **Align:** Confirm spike ordering with the user before writing any code.
3. **Research:** Briefly survey candidate libraries or approaches using web search or docs extraction before building.
4. **Build:** Create isolated, throwaway directories under `spikes/NNN-name/` with runnable CLIs, minimal HTML, or endpoint demos. Can parallelize comparison spikes via subagents.
5. **Verdict:** Document outcomes in each spike's `README.md` with explicit statuses (`VALIDATED`, `PARTIAL`, or `INVALIDATED`), findings, surprises, and recommendations.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill sketch|sketch]] · [[Skill subagent-driven-development|subagent-driven-development]]