---
title: "simple-english"
tags: [skill, hermes]
aliases: ["simple-english"]
---

# simple-english

**simple-english** is an optional Hermes workstation skill that rewrites and audits technical documentation using the rules of ASD-STE100 Simplified Technical English.

- **Origin:** Hermes skill (`~/.hermes/hermes-agent/optional-skills/creative/simple-english/SKILL.md`, adapted from AminBlg/SimpleEnglish)
- **Category:** Workstation skill (Hermes Creative / Technical Writing), not a Zoth product.
- **Reference Standard:** ASD-STE100 Issue 9.

### When to Load
Load this skill when:
- Authoring or auditing developer documentation, operational runbooks, system instructions, or clear error messages.
- Eliminating wordy phrasing, passive voice, synonym rotation, and typical "AI slop" from technical prose.
- Note: Use `humanizer` for essays, blogs, or conversational tone; use `simple-english` strictly for technical procedures and docs.

### Core Capabilities & Rules
- **Classification & Length Limits:** Classifies text into **Procedural** (imperative commands, max 20 words per sentence) or **Descriptive** (explanations, max 25 words per sentence, max 6 sentences per paragraph).
- **Execution Modes:** Supports **Pragmatic mode** (preserves project domain terms like "webhook" or "endpoint") and **Strict mode** (strictly adheres to controlled dictionary constraints).
- **Grammatical Invariants:** Enforces active voice, expands contractions, places conditional clauses before commands ("If X, do Y"), and restricts modals to `can`, `will`, and `must` (banning `should`, `could`, `might`).
- **Code Protection:** Leaves identifiers, CLI commands, flags, file paths, and quoted runtime errors unmodified.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill humanizer|humanizer]]