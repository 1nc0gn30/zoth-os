---
title: "grok"
tags: [skill, hermes]
aliases: ["grok"]
---

# grok

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/autonomous-ai-agents/grok/SKILL.md`

## Overview

Orchestrates xAI's Grok Build CLI (`grok`) to delegate autonomous software engineering tasks from within Hermes. Operates as an external coding agent sibling to `codex` and `claude-code`, reading files, executing shell commands, writing patches, and driving git workflows.

## When to Load

- Delegating standalone coding tasks, feature implementations, or large refactors.
- Performing automated pull request reviews or security diff inspections.
- Running parallel bug-fixing workflows across git worktrees.
- Any task where Grok's model and tool engine are preferred over local Hermes execution.

## Execution Modes & Orchestration

- **Headless Mode (`-p`, Preferred):** Runs non-interactive one-shot jobs and exits cleanly. Always pair with `--no-auto-update` to bypass background update network checks.
  - Autonomous write mode: Add `--always-approve` to bypass interactive confirmation prompts.
  - Read-only review/audit: Omit `--always-approve` and parse output with `--output-format json` or plain text.
- **Interactive TUI Mode:** Fullscreen terminal interface driven inside `tmux` sessions via PTY allocation.
- **ACP Mode (`grok agent stdio`):** Runs as an Agent Client Protocol agent over JSON-RPC.

## Configuration & Environment

- **Authentication:** Subscriptions (SuperGrok / X Premium+) authenticate via `grok login`, storing tokens in `~/.grok/auth.json`. Supports API key fallback via `XAI_API_KEY`.
- **Project Compatibility:** Automatically detects and ingests `CLAUDE.md`, `.claude/` directories, and `AGENTS.md` configuration files. Can run outside git repositories for throwaway scratch tasks.
- **Session Management:** Tracks multi-turn sessions using UUIDs with `--session-id`, `--resume`, or `--continue`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill codex|codex]] · [[Skill claude-code|claude-code]] · [[Skill hermes-agent|hermes-agent]]