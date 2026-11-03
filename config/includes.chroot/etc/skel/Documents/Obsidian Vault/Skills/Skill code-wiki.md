---
title: "code-wiki"
tags: [skill, hermes]
aliases: ["code-wiki"]
---

# code-wiki

**code-wiki** is a Hermes workstation skill (not a Zoth product) that automatically generates structured reference documentation and Mermaid diagrams for any local or cloned codebase.

- **Origin:** Hermes skill
- **Path:** `~/.hermes/hermes-agent/optional-skills/software-development/code-wiki/SKILL.md`

### Core Capabilities

- **Structured Wiki Generation:** Creates a standardized documentation suite in `~/.hermes/wikis/<repo>/` containing `README.md`, `architecture.md`, `getting-started.md`, and optional `api.md`.
- **Mermaid Visualizations:** Generates system flowcharts, class relationship diagrams (`classDiagram`), and interaction sequence traces (`sequenceDiagram`) strictly grounded in real source files.
- **Per-Module Deep Dives:** Inspects entry points and package manifests to document responsibilities, public APIs, key files, and dependencies across 8–10 prioritized modules.
- **Local Tooling Only:** Relies entirely on native agent tools (`terminal`, `read_file`, `search_files`, `write_file`) with zero external API or Docker requirements.
- **State Tracking:** Records generated commits, dates, and documented modules in `.codewiki-state.json` to facilitate future updates or diffs.

### When to Load

Load when onboarding to an unfamiliar repository, creating architectural maps, or generating exportable Markdown/Mermaid wikis for local projects or GitHub URLs. It is not intended for single-file questions or inline API lookups.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill codebase-inspection|codebase-inspection]] · [[Skill github|github]]