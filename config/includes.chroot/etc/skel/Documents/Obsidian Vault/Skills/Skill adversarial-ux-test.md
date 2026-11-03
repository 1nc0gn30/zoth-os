---
title: "adversarial-ux-test"
tags: [skill, hermes]
aliases: ["adversarial-ux-test"]
---

# Adversarial UX Test

A workstation skill from Hermes for roleplaying a hostile, non-technical user persona to discover UX friction and triaging feedback through an objective pragmatism filter.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/dogfood/adversarial-ux-test/SKILL.md`

## When to load
Load this skill when auditing web or software products for user friction before major demos, launches, or redesigns:
- Testing onboarding flows, empty states, and cold-start experiences as a first-time user.
- Uncovering terminology jargon, navigation traps, unhelpful error states, and excessive step counts (>5 clicks for core jobs).
- Evaluating accessibility flaws (font size, contrast, small click targets) and paywall/signup barriers.

## Operating procedure
1. **Define persona:** Construct a specific, skeptical, low-tech persona with clear goals and low patience.
2. **Inhabit persona:** Browse staging or deployed apps attempting the persona's core tasks; record frustrations and screenshot friction points.
3. **Draft the rant:** Write visceral in-character review sections (The Good, The Bad, The Ugly, Specific Complaints).
4. **Apply pragmatism filter:** Step out of character to categorize issues:
   - **RED:** Real UX bug impacting everyday users (actionable ticket required).
   - **YELLOW:** Valid friction for extreme users (low priority note).
   - **WHITE:** Persona noise / digital resistance (logged, no ticket).
   - **GREEN:** Hidden feature request / missing onboarding cue (candidate ticket).
5. **Create tickets & report:** Generate up to 10 prioritized tickets with verbatim quotes, root causes, and suggested fixes.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill dogfood|dogfood]]