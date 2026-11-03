---
title: "MCP \u00b7 sqlite"
tags: [mcp]
aliases: ["sqlite"]
---

# MCP · sqlite

Official SQLite server (PyPI mcp-server-sqlite). Local database at ~/.zothos/mcp/knowledge.db.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `True`
- **Command:** `uvx mcp-server-sqlite --db-path ~/.zothos/mcp/knowledge.db`
- **Timeout:** 60
- **Sandbox:** `~/.zothos/mcp/knowledge.db`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]