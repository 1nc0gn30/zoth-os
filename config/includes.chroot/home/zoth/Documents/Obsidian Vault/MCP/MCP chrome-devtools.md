---
title: "MCP \u00b7 chrome-devtools"
tags: [mcp]
aliases: ["chrome-devtools"]
---

# MCP · chrome-devtools

Chrome DevTools MCP, headless and isolated, with the WebMCP tool category. It does not attach to the user's open Chrome.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `npx -y chrome-devtools-mcp@1.10.1 --headless --isolated --executablePath /opt/google/chrome/chrome …`
- **Timeout:** 180
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]