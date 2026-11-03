---
title: "MCP \u00b7 grafana"
tags: [mcp]
aliases: ["grafana"]
---

# MCP · grafana

Grafana's official MCP with write tools off. Set GRAFANA_URL and GRAFANA_SERVICE_ACCOUNT_TOKEN, then zoth-mcp enable grafana.

- **Enabled in JSON:** `false`
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline flag:** `False`
- **Command:** `uvx mcp-grafana --disable-write`
- **Timeout:** 120
- **Sandbox:** `/tmp`

Operator policy (2026-10-08): the catalog stays off until you name a server and run `zoth-mcp enable <name>`. AGY starts every listed server and ignores `enabled: false`, so keep AGY's mcp_config empty.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]]