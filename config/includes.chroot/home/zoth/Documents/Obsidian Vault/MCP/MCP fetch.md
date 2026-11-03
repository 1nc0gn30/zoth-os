---
title: "MCP \u00b7 fetch"
tags: [mcp]
aliases: ["fetch"]
---

# MCP · fetch

Official fetch server (PyPI mcp-server-fetch). Reads public pages and respects robots.txt.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `uvx mcp-server-fetch`
- **Timeout:** 60
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]