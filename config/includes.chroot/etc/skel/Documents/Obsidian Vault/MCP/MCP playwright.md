---
title: "MCP \u00b7 playwright"
tags: [mcp]
aliases: ["playwright"]
---

# MCP · playwright

Microsoft Playwright MCP. Browser automation for page checks, using the installed Chrome.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y @playwright/mcp@0.0.83 --browser chrome`
- **Timeout:** 180
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]