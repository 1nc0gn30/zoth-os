---
title: "MCP \u00b7 figma"
tags: [mcp]
aliases: ["figma"]
---

# MCP · figma

Figma's remote MCP. The first call opens OAuth. Off until zoth-mcp enable figma.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y mcp-remote@0.14.3 https://mcp.figma.com/mcp`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]