---
title: "MCP \u00b7 zoth-agent-os"
tags: [mcp]
aliases: ["zoth-agent-os"]
---

# MCP · zoth-agent-os

Zoth OS control bridge. Off until zoth-mcp enable zoth-agent-os.

- **Enabled in JSON:** `false`
- **Ring:** `RING_0_SOVEREIGN` (level 0)
- **Offline flag:** `True`
- **Command:** `python3 /usr/local/bin/zoth-agent-os mcp`
- **Timeout:** 300
- **Sandbox:** `~`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]] · [[CLI zoth-agent-os|zoth-agent-os]]