---
title: "AXPage"
tags: [studio, page]
---

# AXPage

`AXPage` is the documentation and machine-discovery interface in Zoth Studio, served at route `[[Route ax-docs|/ax/docs]]`. It exposes machine-readable specifications, crawler policies, and agent integration utilities for zero-egress enclaves.

## Rendered Capabilities

- **Machine Discovery Manifests**: Provides direct inspect-and-copy access to `/llms.txt`, `/llms-full.txt`, `/ai.txt`, `/sitemap.xml`, and the JSON-AX system ontology profile.
- **AI Crawler Simulator**: Simulates endpoint inspection requests under various AI crawler User-Agents (including GPTBot, ClaudeBot, PerplexityBot, and DeepSeek) with token metrics and payload previews.
- **Sovereign Directive Compiler**: Interactive prompt synthesizer that generates structured agent directives enforcing local loopback and zero-egress invariants.
- **MCP Config Synthesizer & RPC Tester**: Generates Model Context Protocol configuration blocks for AGY, Claude Desktop, Cursor, and Windsurf via `stdio` or `sse` transports, with live JSON-RPC test runners for core tools (`stdp_memory_recall`, `ast_diff_triangulation`, `adytum_lease_secret`, `sovereign_signal_ping`).
- **Enclave Binds & Tool Registry**: Displays active local daemon ports, zero-egress invariants, and micro-tool schemas.

- **Source File:** `zoth-studio-v2/src/pages/AXPage.jsx`
- **Parent / Route:** Served at `/ax/docs` (companion showcase at `[[Route ax|/ax]]`)

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route ax-docs|/ax/docs]] · [[Page AXShowcasePage|AXShowcasePage]]