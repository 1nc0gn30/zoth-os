---
title: "grounded-citations"
tags: [skill, hermes]
aliases: ["grounded-citations"]
---

# grounded-citations

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/skills/research/grounded-citations/SKILL.md`

## Overview

Enforces verifiable citations for factual research and document creation. Employs a deterministic Python ledger script (`scripts/sources.py`) to manage `url → [n]` mappings, ensuring inline numeric citations and bibliography sections originate strictly from retrieved sources rather than model hallucination.

## When to Load

- Compiling research reports, market analyses, technological reviews, and summaries from external sources.
- Authoring documents (markdown, PDF, slides, or docx) that cite, quote, or paraphrase web data.
- Fact-checking workflows requiring audit trails and verbatim evidence matching.
- Multi-source research synthesis requiring explicit source attribution and resolution of conflicting claims.
- *Note:* Omit for routine code authoring, casual dialogue, or internal knowledge generation.

## Mechanics & Ledger Tooling

- **Source Registration:** URLs are registered during web retrieval (`sources.py add <url>` or `sources.py ingest <json>`) prior to drafting prose.
- **In-Text Citation Discipline:** Bracketed numbers (`[1][2]`) are placed immediately after supported sentences (maximum 3 IDs per sentence). Unsupported assertions from base model knowledge are tagged `[unverified]`.
- **Fact-Checking & Evidence Gates:**
  - `sources.py quote <id> --text "..." --from page.txt`: Attaches exact quotes from fetched pages; fails if text is not verbatim.
  - `sources.py verify draft.md --evidence --min-coverage 0.5`: Validates that draft IDs exist in the ledger and meet provenance coverage targets.
  - `sources.py render --replace-in draft.md`: Generates and updates the markdown `## Sources` block directly from the ledger.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill arxiv|arxiv]] · [[Skill pdf|pdf]] · [[Skill reddit-reading|reddit-reading]] · [[Skill rss-feeds|rss-feeds]] · [[Skill youtube-content|youtube-content]]