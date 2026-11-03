---
title: "pr-lens"
tags: [skill, hermes]
aliases: ["pr-lens"]
---

# pr-lens

- **Origin:** Hermes (Workstation skill, not a Zoth product; adapted from Coldtea AI)
- **Path:** `~/.hermes/hermes-agent/optional-skills/software-development/pr-lens/SKILL.md`
- **Category:** Software Development / Visualization

## Overview
`pr-lens` renders code changes, system architecture, and data flows as animated SVG diagrams. Structural diffs are defined as a JSON graph document (`.pr-lens/graph.json`) containing lanes, nodes, edges, delta states, and sequence flows, rendered locally via `@coldtea/pr-lens-cli`.

## When to Load
Load when visualising, diagramming, or explaining pull requests, system modifications, or multi-component data flows. PR Lens functions strictly as an architecture comprehension tool rather than a bug linter.

## Workflow & Tooling
- **Diff Analysis**: Inspects repository git diffs to map changed components alongside unchanged context.
- **Graph Authoring**: Structures lanes, delta states (added, removed, modified, unchanged), hero edges, and walkthrough steps in `.pr-lens/graph.json`.
- **Validation**: Executes `npx @coldtea/pr-lens-cli@latest validate .pr-lens/graph.json` to verify schema and reference integrity.
- **Rendering**: Generates animated SVGs and manifests into `.pr-lens/` using `npx @coldtea/pr-lens-cli@latest render`.
- **PR Attachment**: Composes markdown summaries and links rendered SVGs for pull requests using GitHub CLI (`gh`).

## See also

[[MOC Skills]] · [[Zoth OS]]