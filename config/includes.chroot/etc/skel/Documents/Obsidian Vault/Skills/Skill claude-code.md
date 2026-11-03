---
title: "claude-code"
tags: [skill, hermes]
aliases: ["claude-code"]
---

# claude-code

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/autonomous-ai-agents/claude-code/SKILL.md`

## Overview
`claude-code` provides an orchestration guide for delegating autonomous software development, refactoring, and code review tasks to Anthropic's Claude Code CLI from the Hermes agent environment.

## When to Load
Load this skill when:
- Delegating coding tasks, bug fixes, or feature implementations to an external Claude Code agent.
- Running headless, single-command automated code modifications and structured extraction.
- Orchestrating interactive multi-turn coding sessions and PR reviews through terminal multiplexing.
- Managing code workflows that require autonomous tool usage (file edits, shell commands, git operations).

## Orchestration Modes
- **Print Mode (`claude -p`)**: Non-interactive, one-shot execution. Bypasses interactive prompts and workspace trust dialogs, returning results directly to stdout. Best for CI/CD, scripts, and programmatic tasks.
- **Interactive PTY Mode (via `tmux`)**: Runs Claude Code inside a background tmux session (`tmux new-session`), interacting via `tmux send-keys` and monitoring progress with `tmux capture-pane`. Required for multi-turn sessions, slash commands (`/compact`, `/review`), and interactive permission prompts.
- **Prerequisites**: Node.js package `@anthropic-ai/claude-code`, authenticated CLI session (`claude auth login` or `ANTHROPIC_API_KEY`), and `tmux` for interactive flows.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill codex|codex]] · [[Skill hermes-agent|hermes-agent]] · [[Skill opencode|opencode]]