---
title: "grill-me"
tags: [skill, hermes]
aliases: ["grill-me"]
---

# grill-me

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/software-development/grill-me/SKILL.md`

## Overview

Conducts structured adversarial plan interviews to stress-test architectural ideas, specifications, and workflows before any code is written. It models proposals as a design decision tree and systematically challenges assumptions through sequential questioning rounds.

## When to Load

- User prompts: "grill me", "interview my plan", or "stress test this idea".
- Prior to high-impact or complex work such as authentication flows, schema migrations, payment pipelines, or major refactors.
- When a specification contains ambiguous or unstated assumptions.
- Before decomposing tasks for `subagent-driven-development`.
- *Note:* Do not use for existing code review (use `requesting-code-review`) or simple one-off scripting tasks.

## Core Methodology: Frontier Rounds

- **Design Tree & Frontier:** Tracks decisions as a directed tree. The frontier represents all unblocked questions whose prerequisites are already settled.
- **Round-by-Round Questioning:** Asks the entire current frontier in a single batch, with each question accompanied by a recommended choice and brief rationale.
- **Fact Retrieval:** The agent investigates the codebase, configs, and documentation directly rather than asking the user for verifiable facts.
- **Coverage Branches:**
  - *Scope & Boundaries:* Concrete objectives, user constraints, explicit in-scope and out-of-scope items.
  - *Technical Trade-offs:* Architecture rationale, failure modes, rollback strategies, and existing project conventions.
  - *Edge Cases:* Volume scaling, downtime behavior, security ramifications.
- **Synthesis:** Once the frontier is exhausted, generates a bulleted decision log, identifies out-of-scope boundaries, and obtains explicit user approval before writing code.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill requesting-code-review|requesting-code-review]] · [[Skill subagent-driven-development|subagent-driven-development]] · [[Skill test-driven-development|test-driven-development]]