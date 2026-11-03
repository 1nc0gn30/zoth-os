---
title: "MCP \u00b7 redis"
tags: [mcp]
aliases: ["redis"]
---

# MCP · redis

Official Redis reference server. Off until a local Redis is the target.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `True`
- **Command:** `npx -y @modelcontextprotocol/server-redis@2025.4.25`
- **Timeout:** 60
- **Sandbox:** `redis://127.0.0.1:6379`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]