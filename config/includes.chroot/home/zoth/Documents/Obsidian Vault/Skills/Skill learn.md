---
title: "learn"
tags: [skill, grok]
aliases: ["learn"]
---

# learn

Automated harness self-tuning system that analyzes past Grok Build interaction traces to suggest new skills, update stale instructions, and retire unused extensions.

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/learn`)
- **When to load:** Invoked via `/learn`, "learn from my traces", or "what skills do I never use". Explicitly not used for summarizing general sessions into personal memory or vault notes.

## Workflow & Pipeline

1. **Estimation & Scope (`collect_sessions.py --estimate`):** Probes session history, estimates token and agent budgets across scopes (`quick`, `14d`, `30d`, `all`, `since_last`), and prompts for operational mode (`step`, `auto`, `report`).
2. **Session Collection (`collect_sessions.py`):** Filters out headless bots and test runs, extracts human prompts, tool calls, and loaded skills, and outputs sanitized traces to `<GROK_HOME>/learn/runs/<timestamp>`.
3. **Map-Reduce Analysis (`learn-traces.rhai`):**
   - **Map:** Parallel subagents analyze batches of sessions for friction points and frequent prompt patterns.
   - **Reduce:** Iteratively consolidates mapped observations into a single synthesis.
   - **Verify:** Three independent skeptic agents audit proposed changes (repeated phrases, stale lines, candidate deletions) to prevent false positives.
   - **Report:** Emits human-readable `report.md` and structured `actions.json`.
4. **Curation & Application:** Presents verified actions to the user in chat, applying confirmed additions or retirements directly to `~/.grok/skills`.

## See also

[[MOC Skills]] · [[Zoth OS]]