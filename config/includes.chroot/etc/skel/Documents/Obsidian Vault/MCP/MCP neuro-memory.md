---
title: "MCP · neuro-memory"
version: "2.9.0"
tags: [mcp, neuro-memory, stdp]
aliases: ["neuro-memory"]
author: "Neal Frazier Tech (@1nc0gn30) • NullAI Platform"
---

# MCP · neuro-memory (`v2.9.0`)

Zero-dependency Python cognitive memory substrate with SQLite WAL persistence (`~/.neuro-memory/`), 3-factor STDP, CA3/CA1 associative recall, neuromodulation, and Obsidian Second Brain vault bridge.

- **Version:** `2.9.0` (`Apache-2.0`)
- **Tool Count:** `21` (`11` cognitive STDP/neuromodulation + `10` Obsidian Second Brain / Vaelor)
- **Stdio Command:** `/usr/local/bin/neuro-memory mcp` (`python3 -m neuro_memory_daemon.cli mcp`)
- **HTTP JSON-RPC 2.0 Endpoint:** `POST http://127.0.0.1:8094/api/mcp` (`GET /api/mcp/tools` for discovery)
- **Database Directory:** `~/.neuro-memory/`
- **Repository:** [https://github.com/1nc0gn30/neuro-memory-daemon](https://github.com/1nc0gn30/neuro-memory-daemon)
- **Attribution:** Engineered by **Neal Frazier Tech** (`@1nc0gn30`) • [NullAI Platform](https://nullai.tech)

## 21 Registered MCP Tools
- **Cognitive (11):** `memory_store`, `memory_recall`, `memory_search`, `memory_graph`, `memory_consolidate`, `memory_stats`, `memory_diagnostics`, `memory_metacognition`, `neuro_neuromodulator_status`, `neuro_neuromodulate_pulse`, `neuro_flashbulb_tag`
- **Obsidian & Vaelor (10):** `obsidian_vault_search`, `obsidian_wiki_synthesize`, `obsidian_canvas_generate`, `obsidian_doctor_audit`, `obsidian_daily_log`, `obsidian_backlinks_inspect`, `obsidian_bundle_export`, `obsidian_note_read`, `obsidian_note_write`, `obsidian_vaelor_pouw`

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]] · [[CLI neuro-memory|neuro-memory]] · [[Daemon neuro_memory|neuro-memory-daemon]] · [[Unit neuro-memory.service|neuro-memory.service]] · [[06-Wiki/Neuro-Memory 20-Tool MCP Server & Agent Connector Protocol|21-Tool MCP Protocol Wiki]]
