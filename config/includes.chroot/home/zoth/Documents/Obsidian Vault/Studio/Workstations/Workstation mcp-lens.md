---
title: "MCP Lens // Traffic Sniffer & Token Auditor"
tags: [studio, workstation]
aliases: ["mcp-lens"]
---

# MCP Lens // Traffic Sniffer & Token Auditor

The **MCP Lens // Traffic Sniffer & Token Auditor** is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) as an integrated tool within the Tool Arsenal.

### Core Functionality
Zero-dependency real-time stdio/SSE traffic sniffer, token weight auditor, and visual playground for Model Context Protocol.

### Workstation Metadata
- **ID:** `mcp-lens`
- **Name:** MCP Lens // Traffic Sniffer & Token Auditor
- **Type:** `integrated_tool` (standalone sovereign micro-tool and CLI utility available in the Tool Arsenal)
- **Functional Band:** Observe
- **Static Entrypoint:** `/studio/mcp-lens.html`
- **In-App Route:** `/tools/mcp-lens`
- **Tool Repository ID:** `mcp-lens`
- **Pull / Launch Command:** `./bin/mcp-lens serve --port 8109`

### Operational Role
Serves under the Observe band as a real-time protocol inspector for Model Context Protocol (MCP) interactions. It intercepts and visualizes stdio and SSE message frames, measures prompt and response token weight, and offers an interactive testing ground for tool calls and resource schemas.

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Studio mcp-lens|MCP Lens]] · [[CLI mcp-lens|mcp-lens]] · [[Daemon mcp_lens|mcp-lens]] · [[Unit mcp-lens.service|mcp-lens.service]]