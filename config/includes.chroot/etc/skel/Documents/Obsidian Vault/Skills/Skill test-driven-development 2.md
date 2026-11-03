---
title: "test-driven-development"
tags: [skill, hermes]
aliases: ["test-driven-development"]
---

# test-driven-development

Test-Driven Development (TDD) workflow enforcing red-green-refactor disciplines before writing production code.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/software-development/test-driven-development/SKILL.md`
- **Related Skills:** [[Skill systematic-debugging|systematic-debugging]], [[Skill subagent-driven-development|subagent-driven-development]]

## Overview & When to Load

Load this skill during software development tasks including new features, bug fixes, refactoring, and behavioral changes:
- Enforcing the Iron Law: no production code without an observed failing test first.
- Executing the tight RED-GREEN-REFACTOR cycle:
  1. **RED:** Write a single, focused test asserting the required behavior and verify that it fails with the expected error.
  2. **GREEN:** Write the minimal implementation code necessary to pass the test and verify all tests pass without regressions.
  3. **REFACTOR:** Clean up duplication, naming, and structure while keeping tests green.
- Using vertical tracer bullets (iterating red-green per feature slice) rather than speculative horizontal test suites.

## Core Rules

- If production code is written before a test, it must be deleted and implemented fresh from tests.
- Never write tests against mocks when real code can be exercised.
- Keep tests green throughout refactoring; undo immediately if a refactor breaks tests.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill systematic-debugging|systematic-debugging]] · [[Skill subagent-driven-development|subagent-driven-development]]