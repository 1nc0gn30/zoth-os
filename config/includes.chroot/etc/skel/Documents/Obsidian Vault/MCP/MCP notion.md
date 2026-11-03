---
title: "MCP \u00b7 notion"
tags: [mcp]
aliases: ["notion"]
---

# MCP · notion

Notion's official MCP. Needs a Notion integration token. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @notionhq/notion-mcp-server@2.5.2`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]