---
title: "archify"
tags: [skill, hermes]
aliases: ["archify"]
---

# archify

Upstream-maintained generator for validated, interactive HTML technical diagrams from typed JSON specs or Mermaid syntax.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/archify/SKILL.md`
- **Upstream:** `tt-a1i/archify`
- **Platforms:** Linux, macOS, Windows
- **Prerequisites:** Node.js 18+ on PATH

### When to Load
- Generating interactive HTML architecture, workflow, sequence, dataflow, or state-machine lifecycle diagrams.
- Converting Mermaid diagrams (`flowchart`, `sequenceDiagram`, `stateDiagram`) into explorable visual assets.
- Exporting technical diagrams to PNG, JPEG, WebP, SVG, or WebM formats.
- Running verifiable 9-check validation receipts before diagram delivery.

### Key Features
- **Exploration UI:** Embedded dark/light themes, pan/zoom canvas, node search, relationship tracing, and optional animated trace motion.
- **Evidence-Based:** Can inspect repository files to ensure diagram components match codebase realities.
- **Fallback Relationship:** Uses the zero-dependency [[Skill architecture-diagram|architecture-diagram]] skill as a lightweight fallback when Node tooling or extended validation is not needed.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill architecture-diagram|architecture-diagram]] · [[Skill excalidraw|excalidraw]] · [[Skill concept-diagrams|concept-diagrams]]