---
title: "MCP \u00b7 duckdb"
tags: [mcp]
aliases: ["duckdb"]
---

# MCP · duckdb

Placeholder. @duckdb/mcp-server was not on npm on 2026-10-07, so this stays off.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `True`
- **Command:** `npx -y @duckdb/mcp-server --db-path /home/zoth/.zothos/mcp/analytics.duckdb`
- **Timeout:** 120
- **Sandbox:** `/home/zoth/.zothos/mcp/analytics.duckdb`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]