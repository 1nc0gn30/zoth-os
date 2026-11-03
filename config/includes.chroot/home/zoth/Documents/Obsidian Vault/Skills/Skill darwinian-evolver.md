---
title: "darwinian-evolver"
tags: [skill, hermes]
aliases: ["darwinian-evolver"]
---

# darwinian-evolver

- **Origin:** Hermes skill (workstation skill, not a Zoth product; wrapper around Imbue's AGPL-3.0 evolver)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/darwinian-evolver/SKILL.md`
- **Tags:** `evolution`, `optimization`, `prompt-engineering`, `research`

## Overview
An evolutionary optimization skill utilizing Imbue's `darwinian_evolver` framework to iteratively evolve and optimize prompts, regular expressions, SQL queries, or code snippets against defined fitness functions.

## When to Load
- User requests automated prompt tuning, regex evolution, or query/code optimization against an objective test suite or evaluator.
- A deterministic or LLM-judge scorer exists (e.g. unit test pass rate, regex match accuracy, latency metric).
- *Do not use for:* Differentiable continuous targets (prefer gradient descent/DSPy) or purely subjective aesthetic goals without measurable metrics.

## Mechanics & Problem Architecture
- **Triad Definition:**
  - **`Organism`:** Pydantic model encapsulating the candidate artifact (prompt template, regex, SQL query).
  - **`Evaluator`:** Computes a normalized score `[0, 1]` and isolates trainable failure cases (for mutation feedback) from holdout cases (to prevent overfitting).
  - **`Mutator`:** LLM prompt loop generating structural variations conditioned on identified failure modes.
- **Execution Drivers:** Supports the upstream CLI via Anthropic API keys or the included `parrot_openrouter.py` wrapper for arbitrary OpenAI-compatible / OpenRouter endpoints.
- **Artifact Lineage:** Serializes evolutionary snapshots and logs lineage trees inspectable in the bundled HTML tree visualizer (`lineage_visualizer.html`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill arxiv|arxiv]] · [[Skill jupyter-notebook|jupyter-notebook]]