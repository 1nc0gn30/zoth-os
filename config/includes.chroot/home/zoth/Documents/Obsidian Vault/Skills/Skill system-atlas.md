---
title: "system-atlas"
tags: [skill, hermes]
aliases: ["system-atlas"]
---

# system-atlas

Generates explorable, interactive isometric architecture atlases as single-file HTML maps paired with markdown text twins.

- **Origin:** Hermes optional workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/system-atlas/SKILL.md`
- **Author/Upstream:** Harshyt Goel (adapted by Nous Research from `github.com/inkboard/system-atlas`)
- **Prerequisites:** Node.js (uses standard `node:fs`, `node:path`, `node:url` without extra npm packages) and any local static server.

## When to Load
Load this skill when designing, explaining, or reviewing complex system architectures that benefit from interactive, visual exploration ("map the system", "make an atlas", "visualize pipeline flows"), especially when open architecture questions must be systematically tracked across review rounds. (Use standard diagram skills for one-off static diagrams).

## Architecture & Generation Model
- **Single Source of Truth (`data.mjs`):** Contains structures, flow definitions, chapters, architectural decisions, and indexed questions (`Q-<code><n>`).
- **Interactive HTML Twin (`atlas.html`):** A self-contained isometric canvas built via `node build.mjs`. Features chapter-by-chapter progressive disclosure, inspectable animated data packets, structure pinning, and detailed sub-steps.
- **Markdown Text Twin (`SYSTEM.md`):** Generated in tandem with the HTML atlas, providing a complete text breakdown of decisions, structure catalogs, and question resolution statuses.
- **Companion Docs:** Sits alongside a hand-written one-line-per-noun glossary (`CONTEXT.md`) and architectural decision records (`adr/`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill architecture-diagram|architecture-diagram]] · [[Skill excalidraw|excalidraw]]