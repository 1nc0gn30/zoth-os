---
title: "MCP \u00b7 memory"
tags: [mcp]
aliases: ["memory"]
---

# MCP · memory

Official memory server. A local knowledge graph for the agent.

- **Enabled in JSON:** `false`
- **Ring:** `RING_0_SOVEREIGN` (level 0)
- **Offline flag:** `True`
- **Command:** `npx -y @modelcontextprotocol/server-memory@2026.8.31`
- **Timeout:** 60
- **Sandbox:** `~/.zothos/mcp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]] · [[Route memory|/memory]]