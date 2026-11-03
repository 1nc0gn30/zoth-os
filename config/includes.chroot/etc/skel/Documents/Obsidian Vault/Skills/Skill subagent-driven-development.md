---
title: "subagent-driven-development"
tags: [skill, hermes]
aliases: ["subagent-driven-development"]
---

# subagent-driven-development

Orchestrates implementation plans by dispatching fresh, isolated subagents per task coupled with mandatory two-stage review loops.

- **Origin:** Hermes optional workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/software-development/subagent-driven-development/SKILL.md`
- **Author/Attribution:** Hermes Agent (adapted from `obra/superpowers` and `gsd-build/get-shit-done`)

## When to Load
Load this skill when executing multi-task feature plans where tasks are modular, clean context isolation is needed to prevent accumulated state pollution, and systematic review is required between tasks.

## Core Process & Review Pipeline
1. **Plan Extraction:** Reads the plan once upfront and populates a tracked task list via `todo()`. Subagents receive their task prompt and context directly.
2. **Implementer Subagent:** Dispatched via `delegate_task` to write code following Test-Driven Development (TDD: write failing test, write code, pass test, commit).
3. **Spec Compliance Reviewer (Stage 1):** Validates the implementation against the original task specification. Any requirement gap must be fixed before proceeding.
4. **Code Quality Reviewer (Stage 2):** Runs only after Stage 1 passes; inspects coding conventions, error handling, test coverage, and security.
5. **Final Integration Review:** Once all discrete tasks pass, an integration subagent validates holistic system behavior across modules.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill requesting-code-review|requesting-code-review]] · [[Skill test-driven-development|test-driven-development]]