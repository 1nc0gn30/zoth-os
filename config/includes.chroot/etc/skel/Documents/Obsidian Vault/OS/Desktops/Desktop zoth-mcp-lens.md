---
title: "MCP Lens Desktop Entries"
tags: [os, desktop]
aliases: ["zoth-mcp-lens", "mcp-lens.desktop", "Run MCP Lens Self-Diagnostics"]
version: "2.6.0"
---

# MCP Lens Desktop Launchers (`v2.6.0`)

Zero-dependency MCP traffic sniffer, BPE token weight auditor, lossless schema minifier, and 6-tool stdio MCP server.

## Primary Application Launcher (`mcp-lens.desktop`)
- **File:** `/usr/share/applications/mcp-lens.desktop` (synced bit-identically with repo, chroot, and `~/.local/share/applications/mcp-lens.desktop`)
- **Exec:** `/usr/local/bin/mcp-lens desktop`
- **Categories:** `X-Zoth-Dev;Development;Utility;ArtificialIntelligence;`
- **Actions:** `TUI` (`/usr/local/bin/zoth-konsole --title "MCP Lens TUI" -- /usr/local/bin/mcp-lens-tui`), `WebApp` (`xdg-open http://127.0.0.1:8109`)

## Daemon / Diagnostics Launcher (`zoth-mcp-lens.desktop`)
- **File:** `/usr/share/applications/zoth-mcp-lens.desktop` (synced bit-identically between host and chroot)
- **Exec:** `/usr/local/bin/mcp-lens serve --port 8109`
- **Categories:** `X-Zoth-Dev;Development;Network;Utility;X-ZothOS-AI;`
- **Actions:** `Cockpit` (`xdg-open http://127.0.0.1:8109`), `Test` (`/usr/local/bin/zoth-konsole --pause --title "MCP Lens Diagnostics" -- /usr/local/bin/mcp-lens test`)

Engineered by **Neal Frazier Tech** (`@1nc0gn30`) • **NullAI Platform**.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Studio mcp-lens|MCP Lens]] · [[CLI mcp-lens|mcp-lens]]
