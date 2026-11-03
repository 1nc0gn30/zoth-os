---
title: "MCP \u00b7 aws-kb"
tags: [mcp]
aliases: ["aws-kb"]
---

# MCP · aws-kb

Official AWS knowledge-base retrieval reference server. Off until AWS credentials are set.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @modelcontextprotocol/server-aws-kb-retrieval@0.6.2`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]