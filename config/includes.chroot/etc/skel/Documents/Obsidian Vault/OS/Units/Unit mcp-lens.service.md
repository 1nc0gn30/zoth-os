---
title: "mcp-lens.service"
tags: [os, systemd]
version: "2.6.0"
---

# mcp-lens.service (`v2.6.0`)

ZothOS MCP Lens — Model Context Protocol Traffic Sniffer, BPE Token Weight Auditor & Dual-Theme Web Cockpit (`127.0.0.1:8109`).

- **Unit:** `mcp-lens.service`
- **WantedBy:** `multi-user.target`
- **WorkingDirectory:** `%h`
- **ExecStart:** `/usr/local/bin/mcp-lens serve --host 127.0.0.1 --port 8109`
- **Environment:** `PYTHONUNBUFFERED=1`, `PYTHONDONTWRITEBYTECODE=1`
- **Security:** Loopback-only (`127.0.0.1:8109`), strict `Host`/`Origin` `403`, all 4 HTTP security headers + CSP, zero hardcoded home directory paths.
- **Attribution:** Engineered by Neal Frazier Tech (`@1nc0gn30`) • NullAI Platform.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio mcp-lens|MCP Lens]] · [[Workstation mcp-lens|MCP Lens // Traffic Sniffer & Token Auditor]] · [[CLI mcp-lens|mcp-lens]] · [[Daemon mcp_lens|mcp-lens]]
