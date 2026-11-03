---
title: "MCP \u00b7 neuro-memory"
tags: [mcp]
aliases: ["neuro-memory"]
---

# MCP · neuro-memory

Biological-fidelity neuro-memory substrate with STDP, 3-factor neuromodulation, and spreading activation.

- **Enabled in JSON:** `true`
- **Ring:** `RING_0_SOVEREIGN` (level 0)
- **Offline flag:** `True`
- **Command:** `python3 -m neuro_memory_daemon.cli mcp`
- **Timeout:** 60
- **Sandbox:** `~/.neuro_memory`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]] · [[CLI neuro-memory|neuro-memory]] · [[Daemon neuro_memory|neuro-memory-daemon]] · [[Unit neuro-memory.service|neuro-memory.service]]