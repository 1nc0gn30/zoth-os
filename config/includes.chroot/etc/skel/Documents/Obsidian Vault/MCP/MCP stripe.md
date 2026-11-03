---
title: "MCP \u00b7 stripe"
tags: [mcp]
aliases: ["stripe"]
---

# MCP · stripe

Stripe's official MCP. It can create and change live Stripe objects. Set STRIPE_SECRET_KEY, then enable it on purpose.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `False`
- **Command:** `npx -y @stripe/mcp@0.3.3`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]