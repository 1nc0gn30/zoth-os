---
title: "execute-plan"
tags: [skill, grok]
aliases: ["execute-plan"]
---

# execute-plan

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/execute-plan/SKILL.md`)
- **When to load:** Load when asked to execute a plan, run an implementation plan, implement a design document, or when `/execute-plan` is invoked.

## Overview & Architecture

`execute-plan` is an autonomous orchestrator that parses a PR Plan Directed Acyclic Graph (DAG) from a design document and implements it end-to-end. It manages worktree-isolated subagents, runs multi-specialist code reviews, and assembles the resulting changes into a reviewable PR stack.

## Execution Workflow

1. **DAG Parsing & Linearization:** Extracts PR nodes, dependencies, and file scopes from the design doc; assigns topological levels to maximize parallel execution while linearizing dependencies into a deterministic stack.
2. **Assembly Modes:**
   - **Graphite Mode (`gt`):** Assembles stack branches with `gt create` and submits the entire stack via `gt submit --stack`.
   - **Plain-Git Mode:** Assembles chained git branches (`execute-plan/<PLAN_ID>-<pr>-<slug>`) with optional automated PR creation via `gh pr create` (`--auto-pr`).
3. **Subagent Worktree Protocol:** Launches implementer subagents in isolated git worktrees (`isolation: "worktree"`). Fetches completed commits into the main repository via `git fetch <worktree_path> HEAD --no-tags` keyed strictly to `commit_sha`.
4. **Multi-Reviewer Review Loop:** Evaluates each PR with independent reviewer subagents scaled by `--effort` (1–5). Automatically allocates specialist roles (Security Auditor, Tests, Plan Alignment, Simplicity) and repeats fix cycles until 0 open issues remain.
5. **Resumption & Memory:** Persists execution state to JSON under `scratch_dir`, allowing runs to resume via `--resume <PLAN_ID>` and synchronizing recurring issue patterns with workspace memory.

## See also

[[MOC Skills]] · [[Zoth OS]]