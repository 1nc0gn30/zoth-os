---
title: "MCP \u00b7 x-api"
tags: [mcp]
aliases: ["x-api"]
---

# MCP · x-api

X Api official MCP. It can send messages. Off until zoth-mcp enable x-api.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y mcp-remote@0.14.3 https://api.x.com/mcp`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]