---
tool_id: hexstrike-arsenal
name: HexStrike Security Arsenal
category: Security & Recon
version: 3.2.0
local_port: 8138
daemon_mode: on-demand
studio_route: http://127.0.0.1:3000/tools/hexstrike-arsenal
showcase_route: http://127.0.0.1:3000/hexstrike
standalone_url: http://127.0.0.1:8138/
cli_binary: /usr/local/bin/hexstrike-arsenal
repo_path: ~/NullAITech/NullAI-HexStrike-AI-Terminal
chroot_opt: /opt/hexstrike-arsenal
mcp_tool_count: 8
catalog_count: 156
test_status: PASS (v3.2.0 Hardened & Dual-Theme Verified)
access_model: 100% Free & Open-Access (Zero Paywalls)
last_verified: '2026-11-27'
tags:
- tool
- security
- mcp
---

# HexStrike Security Arsenal (`hexstrike-arsenal` v3.2.0)

> **100% Free & Open-Access Tool** — Zero paywalls, zero license modals, zero fabricated audit grades. Optional support via [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

## 1. Architecture & Verified Surfaces

- **Standalone On-Demand Loopback Daemon (`server.py`, `127.0.0.1:8138`)**: Zero-dependency Python 3 stdlib HTTP server supporting `--host`/`--port`, full CSP and security headers, strict loopback `Host` (`400`) and `Origin` (`403`) guards, `HEAD` support, `64 KiB` POST cap (`413`), `Path.is_relative_to()` static containment, and zero Python version disclosure.
- **Dual-Theme Workstation UI (`public/index.html`)**: Editorial Ivory Light (`#FAF8F3`) + Obsidian Crimson Dark (`#07090e`) with `?theme=light|dark`, DOM-safe rendering (zero `innerHTML`), 156-tool dropdown sync, live/offline HTTP Header Auditor, and Shannon Byte Entropy Analyzer.
- **Zoth Studio v2 God-Mode Route (`/tools/hexstrike-arsenal`, `/hexstrike`, `/hexstrike/docs`)**: Powered by the pure shared engine `src/utils/hexstrikeEngine.js` (mirrored at `server/hexstrike-engine.mjs`) with honest `UNVERIFIED (CORS-blocked)` header handling, honest loopback port probe classification, zero fake Shodan credits, and explicit opt-in public DoH / InternetDB lookups.
- **Unified ZothOS CLI, Braille TUI & Chroot Parity**: Identical portable wrappers at `~/NullAITech/NullAI-HexStrike-AI-Terminal/bin/hexstrike-arsenal`, `~/.local/bin/{hexstrike-arsenal,hexstrike}`, `/usr/local/bin/{hexstrike-arsenal,hexstrike,hexstrike-ai}`, `~/NullAITech/bin/hexstrike-arsenal`, and chroot, plus live `:8138`/catalog Braille monitor (`hexstrike-arsenal-tui`) and lean `< 300 KB` chroot `/opt/hexstrike-arsenal/`.
- **8 JSON-RPC 2.0 MCP Tools (`mcp_server.py`)**: `hexstrike_list_tools`, `hexstrike_generate_cmd`, `hexstrike_port_scan`, `hexstrike_target_intel`, `hexstrike_generate_report`, `hexstrike_audit_headers`, `hexstrike_shannon_entropy`, `hexstrike_audit_repo`.

## 2. Core CLI Commands

```bash
hexstrike-arsenal list --min-score 10 --json
hexstrike-arsenal cmd nmap 127.0.0.1 --json
hexstrike-arsenal scan 127.0.0.1 --ports 22,3000,8094,8138,11434 --json
hexstrike-arsenal headers --url http://127.0.0.1:8138 --json
hexstrike-arsenal entropy --file README.md --json
hexstrike-arsenal audit --path . --json
hexstrike-arsenal status --json
hexstrike-arsenal-tui --status
```

## 3. Connected Canon Notes

[[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[MCP hexstrike-ai]] · [[Zoth Memory]] · [[Public Surfaces]]
