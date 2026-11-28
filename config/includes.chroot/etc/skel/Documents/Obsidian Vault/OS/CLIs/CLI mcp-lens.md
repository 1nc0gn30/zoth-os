---
title: "mcp-lens"
tags: [os, cli, mcp]
aliases: ["mcp-lens", "mcp-lens-tui"]
version: "2.6.0"
---

# mcp-lens (`v2.6.0`)

`file`: Python script (`#!/usr/bin/env python3`).

Image CLI `mcp-lens` at `/usr/local/bin/mcp-lens` and `~/.local/bin/mcp-lens` (4-way bit-identical with `~/NullAITech/mcp-lens/bin/mcp-lens` and ZothOS chroot `/usr/local/bin/mcp-lens`). Resolves `$ZOTH_REPO_DIR`, script root, `~/NullAITech/mcp-lens`, or `/opt/mcp-lens` dynamically with zero hardcoded user home paths.

**Shebang / kind:** `/usr/bin/env python3`

**Paired TUI:** `/usr/local/bin/mcp-lens-tui` (live `:8109/api/stats` & `/health` Unicode `U+2800` Braille telemetry inspector with local `MCPTrafficAnalyzer` fallback).

Engineered by **Neal Frazier Tech** (`@1nc0gn30`) • **NullAI Platform**.

## Subcommands
- `mcp-lens serve --host 127.0.0.1 --port 8109` — Start hardened Dual-Theme Web Cockpit & REST/SSE server
- `mcp-lens proxy --port 8109 -- <child-cmd>` — Transparent non-blocking stdio proxy (bounded queue, single recording)
- `mcp-lens mcp` — Real stdio JSON-RPC 2.0 MCP server exposing 6 tools (`mcp_audit_schema_tokens`, `mcp_minify_schema`, `mcp_parse_frame`, `mcp_get_traffic`, `mcp_replay_tool`, `mcp_diagnostics`)
- `mcp-lens desktop` — Launch Electron workstation or local browser cockpit
- `mcp-lens status --port 8109 [--json]` — Inspect live daemon metrics and `discovered_tools_count`
- `mcp-lens test` — Run internal parser, BPE token heuristic, and schema minifier self-checks

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio mcp-lens|MCP Lens]] · [[Workstation mcp-lens|MCP Lens // Traffic Sniffer & Token Auditor]] · [[Daemon mcp_lens|mcp-lens]] · [[Unit mcp-lens.service|mcp-lens.service]]
