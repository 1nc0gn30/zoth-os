---
title: "MCP \u00b7 git"
tags: [mcp]
aliases: ["git"]
---

# MCP · git

Official Git server (PyPI mcp-server-git). Uses the working directory of the agent.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `True`
- **Command:** `uvx mcp-server-git`
- **Timeout:** 60
- **Sandbox:** `~`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]] · [[Pkg git|git]]