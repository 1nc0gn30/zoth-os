---
title: "MCP \u00b7 google-maps"
tags: [mcp]
aliases: ["google-maps"]
---

# MCP · google-maps

Official Google Maps reference server. Set GOOGLE_MAPS_API_KEY, then enable it.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @modelcontextprotocol/server-google-maps@0.6.2`
- **Timeout:** 60
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]