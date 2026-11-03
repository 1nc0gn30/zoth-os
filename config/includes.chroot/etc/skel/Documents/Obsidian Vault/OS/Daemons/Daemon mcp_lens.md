---
title: "mcp-lens"
tags: [os, daemon]
aliases: ["mcp_lens", "mcp-lens"]
port: 8109
subsystem: "MCP Infrastructure"
status: "standby"
health_url: "http://127.0.0.1:8109/api/health"
repo: "~/NullAITech/mcp-lens"
---

# mcp-lens

Zero-Dep MCP Sniffer & Token Weight Auditor

- **Name:** `mcp-lens`
- **Ports:** 8109
- **Health:** `http://127.0.0.1:8109/api/health`
- **Stats:** `http://127.0.0.1:8109/api/stats`
- **Repo:** `~/NullAITech/mcp-lens`
- **Optional:** `false`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Studio mcp-lens|MCP Lens]] · [[Workstation mcp-lens|MCP Lens // Traffic Sniffer & Token Auditor]] · [[CLI mcp-lens|mcp-lens]] · [[Unit mcp-lens.service|mcp-lens.service]]