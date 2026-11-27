---
title: "MCP · hexstrike-ai"
tags: [mcp, security]
aliases: ["hexstrike-ai", "hexstrike-arsenal"]
version: "3.2.0"
last_verified: "2026-11-27"
---

# MCP · hexstrike-ai (`hexstrike-arsenal` v3.2.0)

HexStrike local-first security arsenal MCP server. Off in coding agents by default until explicitly enabled (`zoth-mcp enable hexstrike-ai`).

- **Canonical Entrypoint (v3.2.0):** `hexstrike-arsenal mcp` (resolves to `~/NullAITech/NullAI-HexStrike-AI-Terminal/mcp_server.py` or `/opt/hexstrike-arsenal/mcp_server.py`)
- **Transport:** JSON-RPC 2.0 over `stdio` (`protocolVersion: 2024-11-05`)
- **On-Demand Loopback Companion:** `http://127.0.0.1:8138` (`python3 server.py --port 8138`, idle by default)
- **Enabled in JSON:** `false` (operator opt-in policy)
- **Ring:** `RING_2_TOOLMASTER` (level 2)
- **Offline Capable:** `true` (loopback-enforced scanning & local defensive auditors)
- **Sandbox / Intel Store:** `~/.hexstrike`

## 8 Exposed MCP Tools (`mcp_server.py`)
1. `hexstrike_list_tools` — Filter the 156-tool security catalog by category, tag, or usefulness score.
2. `hexstrike_generate_cmd` — Generate shell-quoted (`shlex.quote`) commands with strict target allowlist validation.
3. `hexstrike_port_scan` — Bounded loopback TCP socket probe (`127.0.0.1` / `localhost` / `::1`, max 64 ports).
4. `hexstrike_target_intel` — Read stored local target history from `~/.hexstrike/intel.json`.
5. `hexstrike_generate_report` — Deterministic UTC markdown assessment report.
6. `hexstrike_audit_headers` — Live loopback or offline raw HTTP security header grading (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
7. `hexstrike_shannon_entropy` — Exact Shannon byte entropy (`0.0-8.0 bits/byte`) on files, UTF-8 text, or hex bytes.
8. `hexstrike_audit_repo` — Bounded local defensive static audit (shell sinks, `eval`/`innerHTML`, disabled TLS/webSecurity, secret shapes).

> **Legacy Note:** Earlier ZothOS images shipped `/usr/share/hexstrike-ai/hexstrike_mcp.py` targeting `:8000`. Canonical v3.2.0 uses `hexstrike-arsenal mcp` (`mcp_server.py`) paired with the hardened on-demand `:8138` daemon.

## See also

[[MCP Catalog]] · [[CLI zoth-mcp]] · [[MCP/_index|MCP index]] · [[Studio hexstrike-arsenal|hexstrike-arsenal]] · [[CLI hexstrike-ai|hexstrike-ai]] · [[Desktop hexstrike-ai|hexstrike-ai]]
