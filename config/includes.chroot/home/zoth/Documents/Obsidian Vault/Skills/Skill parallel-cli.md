---
title: "parallel-cli"
tags: [skill, hermes]
aliases: ["parallel-cli"]
---

# Parallel CLI

A workstation skill from Hermes for running agent-native web search, deep research, tabular enrichment, entity discovery, and change monitoring via Parallel's CLI.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/parallel-cli/SKILL.md`

## When to load
Load this skill when an agent or user specifically requires Parallel's vendor workflows:
- The user explicitly mentions Parallel or `parallel-cli`.
- Running async deep multi-step research jobs (`parallel-cli research run --no-wait --json`) that can be polled later.
- Tabular data enrichment on CSV/JSON files (`parallel-cli enrich`) to infer missing columns from web data.
- Entity discovery at scale (`parallel-cli findall`) rather than simple one-off search queries.
- Continuous change tracking and event alerts on target URLs (`parallel-cli monitor`).
- For ordinary one-off web lookups without vendor requirements, native search tools are preferred.

## Key capabilities & CLI commands
- **JSON-first output:** Uses `--json` across all commands for structured machine-readable responses.
- **Search & extraction:** `parallel-cli search` with domain inclusion/exclusion and recency filters; `parallel-cli extract` for targeted URL markdown scraping.
- **Research tiers:** Supports compute tiers (`lite`, `base`, `core`, `ultra`) with context chaining via `--previous-interaction-id`.
- **Enrichment workflows:** `enrich suggest` to discover schema fields, `enrich plan` to output YAML configs, and `enrich run` for batch processing.
- **Authentication:** Configured via `PARALLEL_API_KEY` or interactive/headless login (`parallel-cli login --device`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill duckduckgo-search|duckduckgo-search]] · [[Skill mcporter|mcporter]]