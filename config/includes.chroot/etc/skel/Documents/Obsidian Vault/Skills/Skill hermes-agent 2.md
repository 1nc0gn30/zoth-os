---
title: "hermes-agent"
tags: [skill, hermes]
aliases: ["hermes-agent"]
---

# hermes-agent

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/skills/autonomous-ai-agents/hermes-agent/SKILL.md`
- **Homepage:** `https://github.com/NousResearch/hermes-agent`

## Overview
A comprehensive operational hub and reference guide for Hermes Agent—an open-source, tool-calling autonomous AI agent framework by Nous Research. Hermes operates across terminal, desktop, web, and messaging interfaces, supporting multi-provider LLM backends, persistent memory, and skill-based continuous learning.

## When to Load
- When setting up, executing, or troubleshooting Hermes Agent CLI (`hermes`, `hermes chat -q`), TUI, desktop app, or web dashboard.
- When spawning and orchestrating autonomous agent instances or multi-agent workflows in tmux/worktree environments.
- When configuring model providers, credential rotation, MCP servers, webhooks, or cron jobs.
- When customizing runtime surfaces with skins/themes, desktop plugins, TUI widgets, or pet mascots.

## Core Surfaces & Execution
- **CLI / Chat:** `hermes` for interactive sessions; `hermes chat -q "<prompt>"` for one-shot runs.
- **Surfaces:** Native Electron app (`hermes desktop`), Ink TUI (`hermes --tui`), Web dashboard (`hermes dashboard`), and OpenAI-compatible proxy (`hermes proxy`).
- **Orchestration:** Use `delegate_task` for quick bounded subtasks; spawn independent `hermes` processes (via tmux or one-shot flags) for isolated, long-running operations.

## Critical Invariants
- Configuration settings live in `config.yaml` (updated via `hermes config set KEY VAL`); API keys and secrets reside strictly in `.env`.
- Always resolve paths relative to `$HERMES_HOME` (supporting profile isolation under `~/.hermes/profiles/<name>/`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-code|claude-code]] · [[Skill codex|codex]] · [[Skill opencode|opencode]]