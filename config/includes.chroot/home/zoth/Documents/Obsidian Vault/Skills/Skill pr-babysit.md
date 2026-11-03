---
title: "pr-babysit"
tags: [skill, grok]
aliases: ["pr-babysit"]
---

# pr-babysit

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills`)
- **Path:** `/home/zoth/.grok/bundled/skills/pr-babysit/SKILL.md`
- **When to load:** Triggers on `/pr-babysit` (commands: `add [--ship]`, `remove`, `list`, `check`, `ship [on|off]`), often run continuously via `/loop` (e.g. `/loop 5m /pr-babysit check`).

Autonomous pull request monitor and remediation agent. It tracks GitHub pull requests, diagnoses CI failures, resolves merge conflicts, addresses human and bot review comments, and coordinates PR stacks autonomously.

### Core Features & Architecture
- **Topology Support:**
  - **Independent PRs:** Standalone branches targeting trunk.
  - **Graphite Stacks:** Stacked PRs managed and synced via `gt`.
  - **GitHub Stacked PRs:** Stacked PRs tracked via `gh stack`.
- **Isolated Execution:** Orchestrator dispatches per-group tasks to background subagents running in isolated Git worktrees, keeping the main checkout clean.
- **Remediation Loop:** Inspects check suites and review threads, applies code changes, runs local build/lint verification, and restacks or pushes updates.
- **Opt-in Shipping:** When enabled via `--ship` or `ship on`, evaluates ship-ready gates and automatically lands ready PRs bottom-up.
- **State Persistence:** Tracks PR status, stack ordering, subagent task IDs, and worktree paths in `~/.grok/plugin-data/pr-babysit/watched-prs-<INSTANCE_ID>.json`.

## See also

[[MOC Skills]] · [[Zoth OS]]