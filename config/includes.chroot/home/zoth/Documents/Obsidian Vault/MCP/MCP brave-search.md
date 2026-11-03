---
title: "MCP \u00b7 brave-search"
tags: [mcp]
aliases: ["brave-search"]
---

# MCP · brave-search

Official Brave Search reference server. Set BRAVE_API_KEY, then enable it.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @modelcontextprotocol/server-brave-search@0.6.2`
- **Timeout:** 60
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]