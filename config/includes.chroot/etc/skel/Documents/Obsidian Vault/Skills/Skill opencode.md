---
title: "opencode"
tags: [skill, hermes]
aliases: ["opencode"]
---

# opencode

Orchestrates the [OpenCode](https://opencode.ai) CLI and TUI as an autonomous coding worker from Hermes terminal and process tools. OpenCode is an open-source, provider-agnostic coding agent supporting feature development, code refactoring, and PR reviews.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/autonomous-ai-agents/opencode/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load
- When explicitly requested to use OpenCode.
- When delegating implementation, refactoring, or PR reviews to an external agent.
- When managing long-running coding sessions with process polling and logging.
- When running parallel coding tasks in isolated working directories or git worktrees.

## Key Capabilities & Workflow
- **One-shot execution:** Runs bounded tasks with `opencode run '<prompt>'`, supporting `-f` to attach context files, `--thinking` for reasoning visibility, and `--model` overrides.
- **Interactive TUI sessions:** Spawns `opencode` with background and PTY enabled, submitting input via process tools and exiting with Ctrl+C (`\x03`) or process termination (avoiding `/exit`).
- **PR review:** Reviews pull requests using `opencode pr <id>` or by evaluating git diffs in temporary clones.
- **Session tracking:** Resumes sessions via `--continue` (`-c`) or `--session <id>` (`-s`), and inspects token usage via `opencode stats`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-code|claude-code]] · [[Skill codex|codex]] · [[Skill hermes-agent|hermes-agent]]