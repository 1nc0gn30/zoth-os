---
title: "arxiv"
tags: [skill, hermes]
aliases: ["arxiv"]
---

# arxiv

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/research/arxiv/SKILL.md`

## Overview
The `arxiv` skill provides workflows to query and download academic papers from arXiv using its free public REST API. It requires no API key or third-party dependencies, running with `curl` or Python standard library scripts (`scripts/search_arxiv.py`).

## When to Load
Load this skill when:
- Searching academic papers by keyword, author (`au:`), title (`ti:`), abstract (`abs:`), or category (`cat:cs.AI`, `cat:cs.LG`).
- Fetching specific paper metadata or BibTeX citations by arXiv ID.
- Extracting paper abstracts or reading full PDF papers.
- Exploring citation networks, references, and related paper recommendations using the Semantic Scholar API.

## Core Capabilities
- **Search Queries**: Supports field prefixes and boolean logic (`AND`, `OR`, `ANDNOT`), with sorting by relevance or submission date.
- **Parsing**: Processes Atom XML responses into structured paper summaries (titles, authors, publication dates, and PDF links).
- **BibTeX Generation**: Generates standard BibTeX citation entries directly from paper metadata.
- **Semantic Scholar Integration**: Queries citation counts, references, author profiles, and recommendation endpoints.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pdf|pdf]]