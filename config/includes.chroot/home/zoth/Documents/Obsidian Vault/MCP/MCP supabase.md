---
title: "MCP \u00b7 supabase"
tags: [mcp]
aliases: ["supabase"]
---

# MCP · supabase

Supabase's official MCP. Can change a project. Set SUPABASE_ACCESS_TOKEN, then enable it.

- **Enabled in JSON:** `false`
- **Ring:** `RING_1_SYSADMIN` (level 1)
- **Offline flag:** `False`
- **Command:** `npx -y @supabase/mcp-server-supabase@0.13.0`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]