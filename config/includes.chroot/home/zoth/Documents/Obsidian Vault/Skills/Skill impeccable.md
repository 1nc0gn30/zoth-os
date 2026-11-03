---
title: "impeccable"
tags: [skill, hermes]
aliases: ["impeccable"]
---

# impeccable

Frontend design language and deterministic UI audit suite for AI coding agents.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/impeccable/SKILL.md`
- **Author / Upstream:** Paul Bakaus (`pbakaus/impeccable`)
- **Documentation:** `https://impeccable.style`

## Purpose & Overview

`impeccable` is an upstream-maintained design skill providing structured guidance, typography and palette curation, and deterministic anti-slop detection for web development. It eliminates generic AI aesthetic tropes such as canned purple gradients, nested card wrappers, and overused font pairings.

## When to Load

- Scaffolding or establishing visual identity for web apps (`/impeccable init`, `typeset`, `colorize`).
- Reviewing and refining UI hierarchy, contrast, and layout (`/impeccable critique`, `audit`, `polish`).
- Running automated, zero-API rule checks on front-end codebases using the deterministic linter (`npx impeccable detect`).
- Applying targeted aesthetic adjustments (`/impeccable bolder`, `quieter`, `animate`, `delight`).

## Core Commands & Sub-commands

- `hermes skills install impeccable`: Installs the verified live bundle from upstream.
- `/impeccable init`: Initializes design system rules and configuration in the project.
- `npx impeccable detect`: Evaluates code against a 61-rule deterministic anti-pattern linter without needing an LLM.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-design|claude-design]] · [[Skill popular-web-designs|popular-web-designs]]