---
title: "create-workflow"
tags: [skill, grok]
aliases: ["create-workflow"]
---

# create-workflow

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/create-workflow/SKILL.md`)
- **When to load:** Load when the user wants to author or edit a multi-agent workflow, automate pipeline orchestration, or runs `/create-workflow`.

## Overview & Purpose

`create-workflow` guides authoring and smoke-testing deterministic Rhai orchestration scripts (`.rhai`) executed by the Grok `workflow` tool. It also serves as the complete reference for the Rhai workflow dialect, host APIs, and journal execution semantics.

## Authoring Procedure

1. **Intent & Scope:** Determine pipeline goals, parallel fan-out, verification gates, and agent count. Save to `<repo>/.grok/workflows/<name>.rhai` (project) or `~/.grok/workflows/<name>.rhai` (user).
2. **Script Structure:** Begin with a pure literal `let meta = #{ name: "...", phases: [...] }` map, followed by JSON schema definitions and phase blocks.
3. **Smoke Check:** Run `workflow` tool with `{ script: "<rhai>", validate_only: true }` with representative arguments to verify compilation and canned-host execution.
4. **Deploy & Run:** Persist script to disk for invocation via `/<name>` or `/workflow <name> ...`, and trigger background execution viewable in `/workflows`.

## Key Host APIs & Dialect Invariants

- `agent(prompt, opts)`: Spawns an agent task with capabilities (`"read-only"`, `"read-write"`, `"execute"`), schema validation, or workspace isolation.
- `parallel(jobs)`: Bounded parallel fan-out barrier; panels are evaluated atomically against `agent_budget` (default 128, up to 1,024).
- `phase(title)` & `log(msg)`: Structure workflow visualization and UI progress rails.
- `await_user(kind, msg)` & `pause(kind, msg)`: Pause execution for user input or invariants without breaking state.
- `complete(result)`: Finalizes the run with structured results or scratch reports (`write_scratch_file`).
- **Resumption:** Journal-based checkpointing commits completed calls; scripts must remain deterministic without relying on unseeded randomness or wall clocks.

## See also

[[MOC Skills]] · [[Zoth OS]]