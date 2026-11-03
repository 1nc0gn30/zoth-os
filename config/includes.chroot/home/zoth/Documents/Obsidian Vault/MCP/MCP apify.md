---
title: "MCP \u00b7 apify"
tags: [mcp]
aliases: ["apify"]
---

# MCP · apify

Apify's official actors MCP. Needs an Apify token. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @apify/actors-mcp-server@0.17.4`
- **Timeout:** 180
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]