---
title: "MCP \u00b7 mongodb"
tags: [mcp]
aliases: ["mongodb"]
---

# MCP · mongodb

MongoDB's official MCP. Needs a connection string. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `False`
- **Command:** `npx -y @mongodb-js/mongodb-mcp-server@0.0.3`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]