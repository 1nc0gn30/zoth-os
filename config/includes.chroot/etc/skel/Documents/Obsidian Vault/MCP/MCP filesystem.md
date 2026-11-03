---
title: "MCP \u00b7 filesystem"
tags: [mcp]
aliases: ["filesystem"]
---

# MCP · filesystem

Official filesystem server. Sandboxed to the home directory, Zoth share, /opt, /etc/zothos, and /tmp.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `True`
- **Command:** `npx -y @modelcontextprotocol/server-filesystem@2026.8.31 ~ /usr/share/zothos /opt /etc/zothos …`
- **Timeout:** 60
- **Sandbox:** `~`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]