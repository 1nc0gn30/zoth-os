---
title: "MCP \u00b7 postgres"
tags: [mcp]
aliases: ["postgres"]
---

# MCP · postgres

Official Postgres reference server for postgresql://postgres@localhost:5432/zothos. Off until that database is up.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `True`
- **Command:** `npx -y @modelcontextprotocol/server-postgres@0.6.2 postgresql://postgres@localhost:5432/zothos`
- **Timeout:** 120
- **Sandbox:** `postgresql://postgres@localhost:5432/zothos`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]