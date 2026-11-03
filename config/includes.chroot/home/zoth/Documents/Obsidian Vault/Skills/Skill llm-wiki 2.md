---
title: "llm-wiki"
tags: [skill, hermes]
aliases: ["llm-wiki"]
---

# llm-wiki

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/research/llm-wiki/SKILL.md`

## Overview
Implements Andrej Karpathy's LLM Wiki pattern to create, curate, and query a persistent, compounding knowledge base of interlinked markdown files without relying on ephemeral RAG lookups.

## When to Load
- Initializing or structuring a new personal or domain-specific markdown knowledge base.
- Ingesting external sources (articles, papers, transcripts) into immutable storage (`raw/`) and synthesizing facts across entity, concept, and comparison pages.
- Querying existing compiled knowledge, returning synthesized answers with explicit page citations.
- Filing novel syntheses, side-by-side comparisons, or complex research queries back into the knowledge base.
- Auditing and health-checking the wiki for orphan pages, broken `wikilinks`, schema violations, stale facts, and unindexed notes.
- Integrating with Obsidian or configuring headless background sync via `obsidian-headless`.

## Core Architecture
- **Layer 1 (Raw Sources):** Immutable source documents stored in `raw/` with cryptographic hashes (`sha256`) to detect drift.
- **Layer 2 (The Wiki):** Agent-maintained markdown files (`entities/`, `concepts/`, `comparisons/`, `queries/`) with mandatory cross-links and YAML frontmatter.
- **Layer 3 (Schema & Catalogs):** Structural governance through `SCHEMA.md`, an indexed catalog in `index.md`, and an append-only audit trail in `log.md`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill obsidian|obsidian]] · [[Skill arxiv|arxiv]]