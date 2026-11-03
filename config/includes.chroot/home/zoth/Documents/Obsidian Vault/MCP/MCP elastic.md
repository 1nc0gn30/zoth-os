---
title: "MCP \u00b7 elastic"
tags: [mcp]
aliases: ["elastic"]
---

# MCP · elastic

Elastic's official Elasticsearch MCP. Off until enabled.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `False`
- **Command:** `npx -y @elastic/mcp-server-elasticsearch@0.3.1`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]