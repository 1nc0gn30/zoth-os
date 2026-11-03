---
title: "node-inspect-debugger"
tags: [skill, hermes]
aliases: ["node-inspect-debugger"]
---

# node-inspect-debugger

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/software-development/node-inspect-debugger/SKILL.md`
- **Category:** Software Development / Debugging
- **Platforms:** Linux, macOS, Windows

## Overview

The `node-inspect-debugger` workstation skill guides programmatic and interactive debugging of Node.js runtimes using the built-in V8 inspector and the Chrome DevTools Protocol (CDP). It enables setting breakpoints, stepping through execution, walking call stacks, dumping closure scopes, and evaluating arbitrary JS expressions in paused frames.

## When to Load

Load this skill when:
- Investigating failing Node.js tests or script errors where `console.log` is insufficient.
- Debugging interactive React/Ink terminal applications (such as `ui-tui`) before render.
- Inspecting closure state or asynchronous execution chains that hang or crash.
- Capturing non-interactive CPU profiles or heap snapshots from long-running Node processes.

## Key Tooling & Workflows

- **Interactive REPL (`node inspect`):** Launch paused with `node inspect <script>` or `node --inspect-brk`. Stepping commands include `c` (continue), `n` (next), `s` (step into), `o` (step out), `sb(line)` (set breakpoint), `bt` (backtrace), and `repl` (scope evaluation).
- **Process Attachment:** Trigger inspector listener on active Node processes via `kill -SIGUSR1 <pid>`, then attach via `node inspect -p <pid>` or WebSocket URL.
- **Scriptable CDP Automation:** Use `chrome-remote-interface` to script headless breakpoints, log scoped properties, or capture `.cpuprofile` and `.heapsnapshot` dumps without manual intervention.

> **Note:** Only Node portions run under this debugger; for Python workers or PTY bridges, use `python-debugpy`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill systematic-debugging|systematic-debugging]] · [[Skill python-debugpy|python-debugpy]]