---
title: "implement"
tags: [skill, grok]
aliases: ["implement"]
---

# implement

Autonomous implement-review-fix orchestration loop coordinating specialized implementer and reviewer subagent personas until code reaches zero defects.

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/implement`)
- **When to load:** Loaded when requested to `/implement`, "implement", "build", "add feature", or "fix bug". Supports optional `--effort 1..5` argument.

## Architecture & Workflow

- **Orchestration Discipline:** The parent agent acts purely as a coordinator, never editing files directly. All implementation, edits, and refactors are delegated to an `implementer` subagent, while code audits are delegated to specialized `reviewer` subagents.
- **Effort-Based Multi-Reviewer Scaling:**
  - **Effort 1:** 2 reviewers (1 general + simplicity specialist).
  - **Effort 2–5:** Scales dynamically up to 7 parallel reviewers (general, security auditor, tests, plan alignment, and simplicity).
- **The Zero-Issue Loop:** Reviews are aggregated into a unified review markdown document. If any severity issues exist, the implementer subagent is re-invoked to fix them, followed by re-reviews until all reviewers report 0 issues.
- **Memory Feedback Integration:** Retrieves historical review patterns at startup (`setup`) and flushes discovered patterns back to memory upon completion (`memory-flush`).
- **Phase Scaffolding:** Manages execution phases via canonical IDs (`setup` → `implement` → `review-round-N` → `fix-round-N` → `rereview-round-N` → `memory-flush` → `final-report`).

## See also

[[MOC Skills]] · [[Zoth OS]]