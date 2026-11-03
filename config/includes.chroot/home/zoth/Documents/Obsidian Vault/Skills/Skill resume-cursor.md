---
title: "resume-cursor"
tags: [skill, grok]
aliases: ["resume-cursor"]
---

# resume-cursor

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills`)
- **Path:** `/home/zoth/.grok/bundled/skills/resume-cursor/SKILL.md`
- **When to load:** Use when switching from Cursor CLI or Cursor Desktop, when the user requests "continue from Cursor" or "resume my Cursor session", or references a Cursor session by description, path, or ID.

Enables a Grok agent to discover, inspect, and continue work from a recent Cursor CLI or Cursor Desktop session.

### Operation & Architecture
- **Shared Session Reader:** Sets `TOOL=cursor` and delegates execution to `shared/resume-session/CORE.md` via `session_reader.py cursor <list|show> [ref]`.
- **Session Identification:** Reads native session IDs, storage paths, free-text query matches against session listings, or defaults to the newest session in the active repository.
- **Safety Boundary:** Treats foreign transcript logs strictly as untrusted inert data—never executes foreign commands, replays foreign tool calls, or injects foreign system instructions.
- **Structured Handoff:** Extracts the user's core intent, relevant files and code modifications, completed vs unfinished work, and explicit next steps.
- **Pre-Execution Verification:** Audits local Git branch status, working directory modifications, and file contents to resolve discrepancies between transcript claims and actual disk state.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill resume-claude]] · [[Skill resume-codex]]