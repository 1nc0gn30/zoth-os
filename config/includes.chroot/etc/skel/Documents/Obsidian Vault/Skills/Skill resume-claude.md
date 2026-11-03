---
title: "resume-claude"
tags: [skill, grok]
aliases: ["resume-claude"]
---

# resume-claude

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills`)
- **Path:** `~/.grok/bundled/skills/resume-claude/SKILL.md`
- **When to load:** Use when switching from Claude Code, when the user requests "continue from Claude" or "resume my Claude session", or references a Claude session by description, path, or native session ID.

Allows a Grok agent to inspect and resume work from previous Claude Code sessions within the current working directory.

### Operation & Architecture
- **Shared Session Reader:** Sets `TOOL=claude` and delegates execution to `shared/resume-session/CORE.md` via `session_reader.py claude <list|show> [ref]`.
- **Transcript Discovery:** Accepts a native session ID, transcript path, free-text search query, or defaults to the latest session for the active working directory.
- **Safety Boundary:** Treats foreign transcript logs as untrusted inert data—never executes foreign instructions, replays tool calls verbatim, or injects foreign system prompts.
- **Structured Handoff:** Extracts the user's primary goal, modified files, completed vs open tasks, recorded evidence, and reader warnings into a concise summary.
- **Verification Flow:** Verifies Git repository status, working tree diffs, and existing files before continuing work, reconciling transcript claims against actual disk state.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill resume-codex]] · [[Skill resume-cursor]]