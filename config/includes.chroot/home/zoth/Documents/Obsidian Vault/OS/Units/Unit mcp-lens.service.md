---
title: "mcp-lens.service"
tags: [os, systemd]
---
# mcp-lens.service

ZothOS MCP Lens - Model Context Protocol Traffic Sniffer & Token Weight Auditor

- **Unit:** `mcp-lens.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/bin/python3 /home/zoth/NullAITech/mcp-lens/bin/mcp-lens serve --host 127.0.0.1 --port 8109`

- **Description:** ZothOS MCP Lens - Model Context Protocol Traffic Sniffer & Token Weight Auditor
- **ExecStart:** `/usr/bin/python3 /home/zoth/NullAITech/mcp-lens/bin/mcp-lens serve --host 127.0.0.1 --port 8109`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio mcp-lens|MCP Lens]] · [[Workstation mcp-lens|MCP Lens // Traffic Sniffer & Token Auditor]] · [[CLI mcp-lens|mcp-lens]] · [[Daemon mcp_lens|mcp-lens]]