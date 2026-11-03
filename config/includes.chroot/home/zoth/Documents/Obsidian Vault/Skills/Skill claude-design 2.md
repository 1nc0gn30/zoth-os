---
title: "claude-design"
tags: [skill, hermes]
aliases: ["claude-design"]
---

# claude-design

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/creative/claude-design/SKILL.md`

## Overview
`claude-design` adapts Claude Design's design process, aesthetics, and high-fidelity artifact production into a local CLI and API agent workflow, replacing hosted web UI dependencies with local file generation and verification.

## When to Load
Load this skill when:
- Designing standalone, from-scratch HTML/CSS/JS artifacts (landing pages, teaser sites, interactive prototypes, slide decks, motion studies).
- Exploring bespoke visual directions and interface variants without cookie-cutter templates.
- Conducting structured design cycles (brief scoping, moodboards, component labs, and local browser checks).
- Pairing with `popular-web-designs` (for specific brand aesthetics) or `design-md` (for token specs).

## Key Principles & Workflow
- **CLI/API Native Execution**: Replaces proprietary hosted runtime tools (`fork_verifier_agent`, `show_html`) with self-contained on-disk HTML files and standard local tools.
- **Multidisciplinary Design**: Functions as a visual designer, UX architect, motion prototyper, or deck designer depending on the brief.
- **Local Artifact Delivery**: Generates complete, functional HTML files with embedded styling and interaction scripts, verified locally before handoff.
- **Design Quality & Anti-Slop**: Prioritizes intentional typography, structured layout grids, purposeful micro-interactions, and contextual variants over generic AI placeholders.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill design-md|design-md]] · [[Skill popular-web-designs|popular-web-designs]] · [[Skill excalidraw|excalidraw]] · [[Skill architecture-diagram|architecture-diagram]]