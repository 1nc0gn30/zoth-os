---
title: "humanizer"
tags: [skill, hermes]
aliases: ["humanizer"]
---

# humanizer

Prose editing skill to identify and strip 34 common AI writing tells while restoring authentic human voice and rhythm.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/creative/humanizer/SKILL.md`
- **Attribution:** Ported from Siqi Chen (`@blader/humanizer`), based on Wikipedia's WikiProject AI Cleanup guide.

## Purpose & Overview

The `humanizer` skill audits and rewrites LLM-generated prose to eliminate predictable statistical patterns (AI slop). It removes formulaic filler and rhetorical posturing while injecting varied sentence rhythm, genuine personality, and perspective.

## When to Load

- De-AI-ing or humanizing drafts, essays, blog posts, documentation, PR descriptions, emails, and release notes.
- Calibrating writing tone against user-provided voice samples (sentence structure, punctuation habits, word choice).
- Auditing drafts before publishing to catch telltale AI habits.

## Patterns Detected & Eliminated

- **Content Inflation:** Significance puffery ("testament", "pivotal moment", "evolving landscape"), superficial `-ing` endings ("underscoring", "fostering"), promotional fluff, and vague attributions ("experts argue").
- **Language Habits:** AI vocabulary ("delve", "tapestry", "intricacies"), copula avoidance ("serves as" instead of "is"), negative parallelisms ("not just... but..."), rule-of-three groupings, and false ranges.
- **Stylistic Artifacts:** Em dash overuse, mechanical bolding, emoji headers, conversational residue ("I hope this helps!"), knowledge cutoff disclaimers, and unprompted reassurance kickers ("and that's okay").

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill songwriting-and-ai-music|songwriting-and-ai-music]]