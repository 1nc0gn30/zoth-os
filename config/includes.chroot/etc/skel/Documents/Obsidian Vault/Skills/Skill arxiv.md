---
title: "arxiv"
tags: [skill, hermes]
aliases: ["arxiv"]
---

# arxiv

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/research/arxiv/SKILL.md`

## Overview
The `arxiv` skill searches and retrieves academic research papers from arXiv via its public REST API. The skill operates without API tokens or external dependencies, using standard HTTP tools (`curl`) and Python stdlib XML parsing.

## When to Load
Load this skill when:
- Searching literature across computer science, machine learning, physics, math, and related disciplines.
- Querying papers with field prefixes (`au:`, `ti:`, `abs:`, `cat:`) and boolean combinations.
- Retrieving paper abstracts and downloading PDFs for research synthesis.
- Formulating BibTeX citations from retrieved metadata.
- Investigating paper citations, references, and recommendations via Semantic Scholar Graph API.

## Core Capabilities
- **API Search**: Queries the arXiv Atom XML API with pagination and sorting by submission date or relevance.
- **Helper Utilities**: Uses `scripts/search_arxiv.py` for automated command-line searches and formatted XML extraction.
- **BibTeX Formatting**: Generates clean `@article` entries including arXiv ID, authors, title, year, and primary category.
- **Semantic Scholar Analysis**: Fetches citation counts, influential citations, referencing works, and author bibliometrics.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pdf|pdf]]