---
title: "MCP \u00b7 azure"
tags: [mcp]
aliases: ["azure"]
---

# MCP · azure

Microsoft Azure MCP. Uses the Azure login. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `False`
- **Command:** `npx -y @azure/mcp@3.0.0-beta.50`
- **Timeout:** 180
- **Sandbox:** `/home/zoth`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]