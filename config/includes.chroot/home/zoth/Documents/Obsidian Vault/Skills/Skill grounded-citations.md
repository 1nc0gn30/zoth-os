---
title: "grounded-citations"
tags: [skill, hermes]
aliases: ["grounded-citations"]
---

# grounded-citations

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/research/grounded-citations/SKILL.md`

## Overview

Implements a Perplexity-style inline citation and grounding engine for agents. Uses an automated Python ledger (`scripts/sources.py`) to map external URLs to stable integers (`url → [n]`), preventing invented citations and allowing mechanical verification of claims.

## When to Load

- Authoring research briefs, technical comparisons, news syntheses, or documents citing external web pages.
- Preparing documents (markdown, PDF, slides, reports) that require an auditable bibliography.
- Rigorous fact-checking tasks where claims must be tied to verbatim excerpts from fetched sources.
- Multi-perspective synthesis where distinct viewpoints need explicit attribution.

## Ledger Operations & Citation Flow

- **Registration (`sources.py add` / `ingest`):** Records source URLs into `$HERMES_HOME/cache/citations/ledger.json` immediately upon retrieval (`web_search`, `web_extract`).
- **Inline Drafting:** Inserts bracketed indices (`[1]`) at the end of each factual statement (up to 3 per sentence). Sentences relying on unsourced knowledge receive `[unverified]`.
- **Evidence Verification:**
  - `sources.py quote <id> --text "..." --from <file>`: Locks verbatim text snippets from target pages to the citation ID.
  - `sources.py verify <draft> [--strict] [--evidence]`: Scans drafts for orphaned IDs, ledger mismatches, and insufficient evidence coverage.
  - `sources.py render --replace-in <draft>`: Rewrites the terminal `## Sources` block using confirmed ledger records.

## Key Rules

- Never hand-edit or invent citation IDs in draft text.
- Register URLs before drafting prose; never reconstruct sources from memory after writing.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill arxiv|arxiv]] · [[Skill pdf|pdf]] · [[Skill reddit-reading|reddit-reading]] · [[Skill rss-feeds|rss-feeds]] · [[Skill youtube-content|youtube-content]]