---
title: "design-md"
tags: [skill, hermes]
aliases: ["design-md"]
---

# design-md

A Hermes workstation skill to author, validate, diff, and export Google's `DESIGN.md` design token specification files.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`creative/design-md`), not a Zoth product. It implements Google's open `DESIGN.md` specification (`google-labs-code/design.md`, Apache-2.0).

## Purpose & Description

The `DESIGN.md` standard couples machine-readable YAML frontmatter (design tokens defining color palettes, typography hierarchies, border radii, spacing scales, and component tokens) with human-readable Markdown rationale. This skill creates and audits these specifications for AI agents and engineering workflows.

### When to Load

- Generating a formal `DESIGN.md` file, design token repository, or visual system specification.
- Translating brand guidelines and style documentation into structured, agent-consumable design tokens.
- Auditing color palettes for WCAG accessibility and contrast compliance.
- Linting syntax, checking token references, and diffing version updates for regressions.
- Exporting token trees to Tailwind CSS themes or W3C DTCG JSON using `npx @google/design.md`.
- *Alternative skills:* Use `popular-web-designs` for layout ideas and inspiration; use `claude-design` for generating one-off creative interfaces.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill popular-web-designs|popular-web-designs]] · [[Skill claude-design|claude-design]] · [[Skill excalidraw|excalidraw]] · [[Skill architecture-diagram|architecture-diagram]]