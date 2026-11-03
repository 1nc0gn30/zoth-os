---
title: "skill-design-principles"
tags: [skill, grok]
aliases: ["skill-design-principles"]
---

# skill-design-principles

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills`)
- **Path:** `/home/zoth/.grok/bundled/skills/skill-design-principles/SKILL.md`
- **When to load:** Load whenever authoring a new agent skill or modifying an existing skill file.

High-signal engineering principles and structural guidelines for drafting, editing, and maintaining coding agent skills.

### Core Principles
- **Single Source of Truth:** Maintain each rule, parameter, or list in one authoritative home rather than duplicating facts across files. Avoid unrequested skill refactors, but highlight redundancy opportunities to the user.
- **Eliminate No-Op Statements & Sprawl:** Strip statements and instructions that are not strictly necessary for skill execution. Avoid redundant negative guardrails (e.g., repeating "do not do X" when updating an instruction directly to "do Y").
- **Fix Root Causes Over One-Off Bandaids:** Resolve the fundamental class of problems where the fact is owned rather than applying downstream symptom patches or hardcoded special cases.
- **Balance & Precision:** Prioritize fulfilling explicit user requests first before suggesting refactoring, and ensure generalizations remain precise, disciplined, and correct.

## See also

[[MOC Skills]] · [[Zoth OS]]