---
title: "gitnexus-explorer"
tags: [skill, hermes]
aliases: ["gitnexus-explorer"]
---

# GitNexus Explorer

A workstation skill from Hermes for indexing repositories into interactive knowledge graphs and serving a visual web UI for exploring symbols, call trees, and execution paths.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/research/gitnexus-explorer/SKILL.md`

## When to load
Load this skill when an agent or user requests visual code intelligence:
- Visually inspecting repository architecture, symbol relationships, and call chains.
- Generating interactive knowledge graphs or dependency maps of a codebase.
- Hosting and sharing a browser-based codebase exploration interface with remote collaborators.

## Key capabilities & workflows
- **Codebase analysis & indexing:** Executes `npx gitnexus analyze` to index symbols and relationships into `.gitnexus/`, with optional embeddings for semantic search.
- **Unified Node.js proxy:** Builds the frontend distribution bundle and serves both the static web UI and `/api/*` backend routes through a lightweight `proxy.mjs` script on a single port.
- **Remote tunnel sharing:** Exposes the local UI via `cloudflared tunnel` for instant external access without requiring root privileges or port forwarding.
- **Scale constraints:** Recommended for repositories under ~5,000 files to avoid browser rendering degradation with massive node counts (30k+ nodes).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]] · [[Skill codebase-inspection|codebase-inspection]]