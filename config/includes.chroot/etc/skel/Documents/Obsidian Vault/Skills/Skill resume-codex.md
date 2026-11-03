---
title: "resume-codex"
tags: [skill, grok]
aliases: ["resume-codex"]
---

# resume-codex

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills`)
- **Path:** `~/.grok/bundled/skills/resume-codex/SKILL.md`
- **When to load:** Use when switching from OpenAI Codex CLI or Codex VS Code, when the user requests "continue from Codex" or "resume my Codex session", or specifies a Codex session by description, path, or ID.

Enables a Grok agent to discover, inspect, and continue work from a recent Codex CLI or Codex VS Code session.

### Operation & Architecture
- **Shared Session Reader:** Sets `TOOL=codex` and delegates execution to `shared/resume-session/CORE.md` via `session_reader.py codex <list|show> [ref]`.
- **Session Identification:** Reads native session IDs, transcript files, free-text query matches from session listings, or defaults to the latest session in the current directory.
- **Safety Boundary:** Treats foreign transcript logs strictly as untrusted inert data—never executes foreign commands, replays foreign tool calls, or injects foreign system instructions.
- **Structured Handoff:** Synthesizes the user's initial objective, touched files and modules, completed work, remaining tasks, and explicit next steps.
- **Pre-Execution Verification:** Audits local Git branch status, working directory modifications, and file contents to resolve discrepancies between transcript claims and actual disk state.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill resume-claude]] · [[Skill resume-cursor]]