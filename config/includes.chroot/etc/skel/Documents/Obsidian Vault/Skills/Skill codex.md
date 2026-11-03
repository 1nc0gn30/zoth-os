---
title: "codex"
tags: [skill, hermes]
aliases: ["codex"]
---

# codex

**codex** is a Hermes workstation skill (not a Zoth product) for delegating software development tasks to OpenAI's autonomous Codex CLI agent.

- **Origin:** Hermes skill
- **Path:** `~/.hermes/hermes-agent/skills/autonomous-ai-agents/codex/SKILL.md`

### Core Capabilities

- **Autonomous Code Delegation:** Runs one-shot tasks (`codex exec "<prompt>"`) or background sessions for building features, executing refactors, and addressing issues.
- **Sandboxing Modes:** Supports `--sandbox workspace-write` (auto-approves changes in the target workspace) and `--sandbox danger-full-access` (for gateway environments where bubblewrap namespaces fail).
- **Git Invariant & PTY:** Enforces execution inside a Git repository (initializing temporary repos for scratch tasks) and requires interactive pseudo-terminals (`pty=true`).
- **Parallel Workflows:** Outlines multi-task parallelization using isolated `git worktree` directories and concurrent background processes monitored via the `process` tool.
- **PR Audits:** Automates single and batch pull request code reviews (`codex review --base origin/main`).

### When to Load

Load when delegating complex programming tasks, automated pull request reviews, or concurrent bug fixes to an external OpenAI Codex CLI process.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-code|claude-code]] · [[Skill hermes-agent|hermes-agent]]