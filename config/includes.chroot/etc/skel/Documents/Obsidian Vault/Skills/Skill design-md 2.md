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

The `DESIGN.md` format pairs machine-readable YAML frontmatter (design tokens for colors, typography, border radii, spacing, and components) with human-readable Markdown rationale. This skill manages the token lifecycle, validates contrast and structure, and exports specs for design-to-code pipelines.

### When to Load

- Authoring a new `DESIGN.md` file or establishing a unified design system token spec.
- Enforcing brand consistency and visual identity rules across multiple codebases.
- Validating color palette accessibility against WCAG contrast algorithms.
- Diffing version revisions to check for breaking design token changes.
- Exporting token specs to Tailwind CSS configs or W3C Design Tokens Community Group (DTCG) JSON using `npx @google/design.md`.
- *Alternative skills:* Use `popular-web-designs` for layout inspiration; use `claude-design` for bespoke one-off HTML/CSS prototypes.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill popular-web-designs|popular-web-designs]] · [[Skill claude-design|claude-design]] · [[Skill excalidraw|excalidraw]] · [[Skill architecture-diagram|architecture-diagram]]