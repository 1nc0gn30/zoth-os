---
title: "MCP \u00b7 time"
tags: [mcp]
aliases: ["time"]
---

# MCP · time

Official time server (PyPI mcp-server-time). Local timezone conversions.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `True`
- **Command:** `uvx mcp-server-time`
- **Timeout:** 30
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]