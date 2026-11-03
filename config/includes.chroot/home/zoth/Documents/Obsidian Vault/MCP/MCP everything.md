---
title: "MCP \u00b7 everything"
tags: [mcp]
aliases: ["everything"]
---

# MCP · everything

Official reference demo server. Exercises the protocol. Off by default.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `True`
- **Command:** `npx -y @modelcontextprotocol/server-everything@2026.8.31`
- **Timeout:** 60
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]