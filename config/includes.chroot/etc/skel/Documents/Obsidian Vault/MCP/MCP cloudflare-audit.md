---
title: "MCP \u00b7 cloudflare-audit"
tags: [mcp]
aliases: ["cloudflare-audit"]
---

# MCP · cloudflare-audit

Cloudflare Audit official MCP. OAuth or a token. Off until zoth-mcp enable cloudflare-audit.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y mcp-remote@0.14.3 https://auditlogs.mcp.cloudflare.com/mcp`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]