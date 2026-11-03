---
title: "design"
tags: [skill, grok]
aliases: ["design"]
---

# design

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/design/SKILL.md`)
- **When to load:** Load when asked to design, author a design doc, system architecture spec, technical specification, or when `/design` is invoked.

## Overview & Architecture

`design` coordinates a rigorous multi-turn **write → review → revise** consensus loop between two dedicated subagent personas: `design-doc-writer` and `design-doc-reviewer`. The orchestrator manages loop lifecycle, issue tracking, and human escalation while delegating all document creation and critique to the subagents.

## Core Lifecycle & Protocol

1. **Initialization:** Resolves Python runtime and generates a stable 8-hex `DESIGN_ID` in a shared scratch directory for `design_doc_file`, `summary_file`, and `review_file`.
2. **Drafting (Step 1):** Spawns `[writer]` with writer persona instructions to create the initial specification, including mandatory "Key Decisions" and "PR Plan" sections.
3. **Review (Step 2):** Spawns `[reviewer]` with reviewer persona instructions to audit the document, cataloging issues by severity and section.
4. **Consensus Check (Step 3):** The loop continues until there are strictly 0 open issues. If the writer marks `wontfix` and the reviewer re-opens the issue, a stalemate is detected and escalated to the user.
5. **Revisions & Re-reviews (Steps 4 & 5):** Re-invokes subagents via `resume_from` to preserve full working memory until complete agreement is reached.
6. **Finalization & Publishing (Step 6):** Presents key decisions, PR plan, and resolved questions. If invoked with `--publish`, discovers tools dynamically to publish to Notion or a secret gist fallback.

## See also

[[MOC Skills]] · [[Zoth OS]]