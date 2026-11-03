---
title: "MCP \u00b7 hermes-bridge"
tags: [mcp]
aliases: ["hermes-bridge"]
---

# MCP · hermes-bridge

Hermes agent bridge. Off until zoth-mcp enable hermes-bridge.

- **Enabled in JSON:** `false`
- **Ring:** `RING_0_SOVEREIGN` (level 0)
- **Offline flag:** `True`
- **Command:** `hermes mcp`
- **Timeout:** 300
- **Sandbox:** `/home/zoth/.hermes`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]