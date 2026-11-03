---
title: "MCP \u00b7 browserbase"
tags: [mcp]
aliases: ["browserbase"]
---

# MCP · browserbase

Browserbase's official cloud-browser MCP. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @browserbasehq/mcp@3.0.0`
- **Timeout:** 180
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]