---
title: "sketch"
tags: [skill, hermes]
aliases: ["sketch"]
---

# sketch

Workstation skill from Hermes (not a Zoth product). Adapted from the Get Shit Done (GSD) workflow.

- **Origin:** Hermes skill
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/sketch/SKILL.md`

## Overview

Generates disposable, interactive HTML mockups with 2–3 distinct design variants to evaluate visual and ergonomic directions side-by-side before writing production code.

## When to Load

- Exploring UI/UX directions before committing to an architecture.
- Prompts like "sketch this screen", "compare layout A vs B", or "give me 2-3 takes on this UI".
- Evaluating density, hierarchy, or aesthetic stance (e.g. calm/editorial vs. utilitarian/dense).

## When NOT to Load

- Building production components or polished one-off landing pages (use `claude-design`).
- Creating diagrams or schematics (use `excalidraw` or architecture diagrams).
- When design decisions are already finalized.

## Core Workflow

1. **Intake:** Clarifies feel/vibe, reference apps, and the single core action.
2. **Variants:** Emits 2–3 standalone, interactive HTML files in `sketches/` differing across meaningful design axes.
3. **Verification:** Inspects rendered HTML in a headless or live browser to verify layouts.
4. **Head-to-Head:** Compares variants via a trade-off table so the user can pick a winner or hybridize.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill spike|spike]] · [[Skill claude-design|claude-design]] · [[Skill popular-web-designs|popular-web-designs]] · [[Skill excalidraw|excalidraw]]