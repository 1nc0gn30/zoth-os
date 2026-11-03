---
title: "MCP \u00b7 puppeteer"
tags: [mcp]
aliases: ["puppeteer"]
---

# MCP · puppeteer

Official Puppeteer reference server. Off by default. Playwright and Chrome DevTools cover browser work.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `True`
- **Command:** `npx -y @modelcontextprotocol/server-puppeteer@2025.5.12`
- **Timeout:** 180
- **Sandbox:** `/tmp/puppeteer_sandbox`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]