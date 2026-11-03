---
title: "llm-wiki"
tags: [skill, hermes]
aliases: ["llm-wiki"]
---

# llm-wiki

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/research/llm-wiki/SKILL.md`

## Overview
Implements Andrej Karpathy's LLM Wiki pattern to build, maintain, and query a persistent, compounding knowledge base of interlinked markdown files.

## When to Load
- Setting up or bootstrapping a new domain knowledge base with defined taxonomies and rules.
- Ingesting raw sources (web pages, PDFs, interview transcripts) into immutable directories while compiling cross-linked pages.
- Querying compiled knowledge to answer questions with direct references to wiki concept or entity pages.
- Filing complex comparison matrices or non-trivial research findings into dedicated query notes.
- Running maintenance audits to detect broken `wikilinks`, orphan pages, missing tags, stale claims, or source drift.
- Connecting markdown vaults to Obsidian desktop or configuring continuous sync via `obsidian-headless`.

## Core Architecture
- **Layer 1 (Raw Material):** Unmodified source text stored in `raw/` with hash checks (`sha256`) to flag changes on re-ingestion.
- **Layer 2 (Compiled Wiki):** Structured notes across `entities/`, `concepts/`, `comparisons/`, and `queries/` adhering to linking thresholds.
- **Layer 3 (Navigation & Rules):** Domain taxonomy in `SCHEMA.md`, directory catalog in `index.md`, and session logs in `log.md`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill obsidian|obsidian]] · [[Skill arxiv|arxiv]]