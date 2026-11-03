---
title: "MCP \u00b7 slack"
tags: [mcp]
aliases: ["slack"]
---

# MCP · slack

Official Slack reference server. Can post messages. Set SLACK_BOT_TOKEN, then enable it.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @modelcontextprotocol/server-slack@2025.4.25`
- **Timeout:** 60
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]