---
title: "MCP \u00b7 firebase"
tags: [mcp]
aliases: ["firebase"]
---

# MCP · firebase

Firebase CLI MCP command. Uses the logged-in Firebase account. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y firebase-tools@15.32.1 mcp`
- **Timeout:** 180
- **Sandbox:** `~`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]