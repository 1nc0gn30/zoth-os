---
title: "MCP \u00b7 kali-parrot-sectools"
tags: [mcp]
aliases: ["kali-parrot-sectools"]
---

# MCP · kali-parrot-sectools

Local Kali and Parrot tool bridge. Off in coding agents until zoth-mcp enable kali-parrot-sectools.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `True`
- **Command:** `python3 /usr/local/bin/zoth-sec mcp`
- **Timeout:** 300
- **Sandbox:** `~`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]