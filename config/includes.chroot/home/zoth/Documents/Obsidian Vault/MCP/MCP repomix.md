---
title: "MCP \u00b7 repomix"
tags: [mcp]
aliases: ["repomix"]
---

# MCP · repomix

Repomix packs the working tree into one file for the agent. Sandboxed to that directory.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `True`
- **Command:** `npx -y repomix --mcp --sandbox`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]