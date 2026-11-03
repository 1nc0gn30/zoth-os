---
title: "antigravity-cli"
tags: [skill, hermes]
aliases: ["antigravity-cli"]
---

# antigravity-cli

Operator guide for running and orchestrating the Antigravity CLI (`agy`) from Hermes. Manages binary verification, plugin configuration, authentication state, and session execution.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/autonomous-ai-agents/antigravity-cli/SKILL.md`
- **Platforms:** Linux, macOS, Windows

### When to Load
- Installing, updating, or smoke-testing the `agy` binary via `terminal`.
- Executing non-interactive scripted tasks or code reviews with `agy -p` / `agy --print`.
- Inspecting Antigravity settings, plugin directories, keybindings, and session logs.
- Managing auth, sandbox profiles, and permissions.

### Mental Model & Execution Patterns
- **Two Command Layers:** Separates outer shell wrapper commands (`agy help`, `agy plugin`, `agy update`) from in-session slash commands (`/config`, `/permissions`).
- **One-Shot Delegation:** Uses `agy -p '<prompt>' --model '<model>'` for fast reviews or scripted generations.
- **Long Bounded Runs:** Invokes `agy -p` with `--dangerously-skip-permissions` in background jobs.
- **Interactive Multi-Turn:** Runs `agy -i` inside a PTY session using tmux for monitoring and input forwarding.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill grok|grok]] · [[Skill codex|codex]] · [[Skill claude-code|claude-code]] · [[Skill hermes-agent|hermes-agent]]