---
title: "dynamic-workflow"
tags: [skill, hermes]
aliases: ["dynamic-workflow"]
---

# dynamic-workflow

Codified plan-in-code orchestration skill for managing large subagent fan-outs, adversarial multi-agent claim verification, and multi-wave codebase refactoring campaigns.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/autonomous-ai-agents/dynamic-workflow/SKILL.md`
- **Author:** Teknium + Hermes Agent

## When to Load
Load this skill when an operational task exceeds single-context limits and can be split into distinct units of work (per-file, per-endpoint, per-record), such as 100+ file code migrations, codebase-wide security audits, or adversarial verification where independent agents refute candidate findings.

## Two-Layer Execution Model
1. **Layer A — Deterministic Orchestration (`execute_code`):**
   - Handles deterministic loops, file parsing, and manifest generation (`manifest.jsonl`).
   - Writes work to an isolated run directory (`<tmp>/wf_<name>_<uuid>/`).
   - Merges structured output files from completed worker runs.
2. **Layer B — Judgment Fan-Out (`delegate_task`):**
   - Dispatches isolated subagent tasks bounded by `delegation.max_concurrent_children` (default 10).
   - Workers execute reasoning, refactoring, or audits, emitting results to disk rather than chat summaries.

## Core Patterns
- **Adversarial Convergence:** Generates falsifiable claims across independent attempts with varied framings, followed by a dedicated refuter wave tasked with breaking each claim with counter-evidence.
- **Campaign Engineering:** Coordinates large multi-worker migrations using a single shared `BRIEF.md`, exclusive cluster ownership, atomic per-worker commits, and integration testing on combined branches.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]] · [[Skill simplify-code|simplify-code]]