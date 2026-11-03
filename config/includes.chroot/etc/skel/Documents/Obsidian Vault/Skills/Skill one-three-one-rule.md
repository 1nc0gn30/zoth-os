---
title: "one-three-one-rule"
tags: [skill, hermes]
aliases: ["one-three-one-rule"]
---

# one-three-one-rule

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/communication/one-three-one-rule/SKILL.md`
- **Category:** Communication / Decision-Making
- **Platforms:** Linux, macOS, Windows

## Overview

The `one-three-one-rule` workstation skill provides a structured decision brief framework for complex technical choices with multiple viable approaches. It disciplines proposals into a single-sentence problem definition, exactly three distinct options with trade-offs, a clear recommendation, a verifiable Definition of Done, and an actionable execution plan.

## When to Load

Load this skill when:
- The user requests a "1-3-1" decision brief or asks for comparative technical choices.
- An architectural, tooling, or migration challenge presents several competing paths with meaningful trade-offs.
- Preparing concise proposals suitable for stakeholder or team review.

> **Note:** Avoid using for trivial single-path tasks, routine debugging, or decisions where the direction is already settled.

## Framework Structure

1. **Problem (1 sentence):** Focus strictly on the core challenge or objective without implementation details or run-on clauses.
2. **Options (exactly 3):** Three genuinely distinct strategies (Options A, B, and C), each detailing practical mechanics, pros, and cons.
3. **Recommendation (1 pick):** An unequivocal recommendation based on context and operational constraints rather than hedging.
4. **Definition of Done:** Verifiable acceptance criteria measuring success for the chosen strategy.
5. **Implementation Plan:** Concrete, sequenced steps specifying tools, files, commands, and validation checks.

## See also

[[MOC Skills]] · [[Zoth OS]]