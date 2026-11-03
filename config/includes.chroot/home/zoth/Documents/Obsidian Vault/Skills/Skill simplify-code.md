---
title: "simplify-code"
tags: [skill, hermes]
aliases: ["simplify-code"]
---

# simplify-code

**simplify-code** is a Hermes workstation skill that executes a parallel 4-angle cleanup pass on recent git code changes to improve readability, maintainability, and architectural depth.

- **Origin:** Hermes skill (`/home/zoth/.hermes/hermes-agent/skills/software-development/simplify-code/SKILL.md`, inspired by Claude Code's `/simplify`)
- **Category:** Workstation skill (Hermes Software Development), not a Zoth product.
- **Related Skills:** [[Skill requesting-code-review|requesting-code-review]], [[Skill test-driven-development|test-driven-development]]

### When to Load
Load this skill when:
- The user requests to "simplify", "clean up changes", or run `/simplify` on uncommitted working-tree changes, staged diffs, or recent commits.
- Performing a post-implementation quality refactor on already working code.
- Note: This is an architectural cleanup pass, not a bug hunt (use `requesting-code-review` for correctness and security audits).

### Core Capabilities & Review Structure
- **Diff Scoping:** Captures working tree changes (`git diff`, `git diff HEAD`, or targeted files).
- **Four Concurrent Reviewer Angles:**
  1. **Code Reuse:** Discovers pre-existing utilities, constants, and shared helpers across the repo to eliminate reimplementation.
  2. **Code Quality:** Eliminates redundant state, parameter sprawl, deep if/else nesting, and AI-generated comment/null-check slop.
  3. **Efficiency:** Identifies redundant computation, N+1 access patterns, silent exception swallowing, and memory retention leaks.
  4. **Altitude:** Catches shallow band-aids and call-site workarounds that should be solved at the root infrastructure level.
- **Risk-Tiered Execution:** Categorizes suggestions into **SAFE** (auto-applied), **CAREFUL** (applied with test validation), and **RISKY** (held for explicit user approval).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill requesting-code-review|requesting-code-review]] · [[Skill test-driven-development|test-driven-development]]