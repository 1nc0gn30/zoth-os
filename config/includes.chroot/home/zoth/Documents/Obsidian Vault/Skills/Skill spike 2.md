---
title: "spike"
tags: [skill, hermes]
aliases: ["spike"]
---

# spike

Workstation skill from Hermes (not a Zoth product). Adapted from the Get Shit Done (GSD) engineering workflow.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/skills/software-development/spike/SKILL.md`

## Overview

Executes throwaway technical experiments to validate feasibility, benchmark competing libraries, and surface unknown risks before writing production code.

## When to Load

- Evaluating technical feasibility ("let me try this", "spike this out", "is this even possible?").
- Running head-to-head library comparisons (e.g. comparing streaming protocols or parsing engines).
- Prototyping risky subsystem mechanics before committing to an architecture.
- *When NOT to load:* When answers are already clear from documentation/code inspection, or when writing production-path features directly.

## Core Method

1. **Decompose:** Breaks complex ideas into 2–5 discrete feasibility questions framed as Given/When/Then, ordered by risk so the highest-risk spike runs first.
2. **Research:** Identifies candidate tools or libraries using search and doc inspection before coding.
3. **Build:** Isolates each test in `spikes/NNN-name/` with zero-overhead, observable interfaces (CLI scripts, small HTML files, or unit assertions).
4. **Verdict:** Formats results as `VALIDATED`, `PARTIAL`, or `INVALIDATED`, documenting trade-offs, edge cases, and recommendations.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill sketch|sketch]] · [[Skill subagent-driven-development|subagent-driven-development]]