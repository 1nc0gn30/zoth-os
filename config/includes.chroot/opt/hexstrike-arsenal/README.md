<div align="center">
  <img src="assets/hero-banner.svg" alt="HexStrike Security Arsenal v3.2 Banner" width="100%" />
</div>

# HexStrike Security Arsenal (`v3.2.0`)

HexStrike (`NullAI-HexStrike-AI-Terminal`) is a local-first defensive and red-team security workstation: a 156-tool command synthesizer, bounded loopback TCP socket probe, live/offline HTTP security header auditor, Shannon byte entropy analyzer, local static repository auditor, and 8-tool Model Context Protocol (MCP) JSON-RPC 2.0 `stdio` server running on `127.0.0.1:8138`.

- **Zoth Studio v2 Dossier**: [https://zoth.nullai.tech/tools/hexstrike-arsenal](https://zoth.nullai.tech/tools/hexstrike-arsenal)
- **Standalone Loopback Daemon (On-Demand)**: `http://127.0.0.1:8138`
- **Support Development**: [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) · Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## What It Does

- **156-Tool Security Catalog (`ui/src/data/tools.json`)**: Searchable index across 11 categories (`Exploit`, `Web`, `Recon`, `Post-Exploit`, `OSINT`, `Documentation`, `Neural`, `Password`, `Wordlist`, `Container`, `Cloud`) with usefulness scores (`1-10`) and tags.
- **Shell-Quoted Command Synthesizer**: Validates targets against a strict allowlist (`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$`, rejecting leading `-` and shell metacharacters) and emits `shlex.quote()`-escaped invocations.
- **Loopback-Scoped TCP Socket Probe**: Zero-dependency Python `socket` probe restricted to `127.0.0.1`, `localhost`, and `::1` by default (max 64 validated ports `1..65535`, context-managed sockets).
- **HTTP Security Header Auditor (`headers` / `/api/headers`)**: Evaluates HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` on loopback URLs or offline pasted raw HTTP headers with honest observed scoring (never fabricates `100/100`).
- **Shannon Byte Entropy Analyzer (`entropy` / `/api/entropy`)**: Computes exact Shannon entropy (`0.0-8.0 bits/byte`), printable ASCII ratio, top byte frequencies, and packing/encryption classification on files, UTF-8 text, or hex payloads.
- **Local Static Repository Auditor (`audit` / `/api/audit`)**: Bounded static check for unsafe shell execution, `eval`/`innerHTML` sinks, disabled TLS/Electron security flags, and secret shapes with `~/` path redaction.

---

## How It Works

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| Standalone HTTP Daemon | `server.py` | Zero-dependency `ThreadingMixIn` loopback server (`--host`, `--port`, default `127.0.0.1:8138`) with CSP/security headers, strict `Host` allowlist (`400`), loopback-only CORS (`403`), `413` body cap (`64 KiB`), and `HEAD` support |
| Dual-Theme Workstation UI | `public/index.html` | Editorial Ivory Light + Obsidian Crimson Dark single-file UI with `?theme=light|dark`, DOM-safe rendering (zero `innerHTML`), 156-tool dropdown sync, header auditor, and Shannon entropy tab |
| CLI Entrypoint | `cli.py` | Unified CLI (`list`/`tools`, `cmd`, `scan`, `headers`, `entropy`, `audit`, `report`, `status`, `serve`, `mcp`) with `--json` output |
| MCP Server (8 Tools) | `mcp_server.py` | JSON-RPC 2.0 `stdio` server (`protocolVersion: 2024-11-05`) and shared defensive security engines |
| Optional FastAPI Backend | `backend/main.py` | Hardened loopback FastAPI API (`backend/requirements.txt`) with `create_subprocess_exec` allowlist (`backend/core/hex_bridge.py`), HTML-escaped reports, anti-traversal checks, and SSRF guard |
| Portable Wrappers & TUI | `bin/hexstrike-arsenal`, `bin/hexstrike-arsenal-tui` | Portable `$HOME`/`/opt/hexstrike-arsenal` wrappers and live `:8138`/catalog Braille monitor |

---

## ZothOS CLI & MCP Commands

```bash
# List and filter the 156-tool catalog
hexstrike-arsenal list --min-score 10 --json
hexstrike-arsenal list --category Web

# Generate shell-quoted commands
hexstrike-arsenal cmd nmap 127.0.0.1 --json

# Loopback TCP socket probe
hexstrike-arsenal scan 127.0.0.1 --ports 22,3000,8094,8138,11434 --json

# Defensive security auditors
hexstrike-arsenal headers --url http://127.0.0.1:8138 --json
hexstrike-arsenal entropy --file README.md --json
hexstrike-arsenal audit --path . --json

# Live status, Braille TUI, on-demand web daemon & MCP stdio server
hexstrike-arsenal status --json
hexstrike-arsenal-tui --status
python3 server.py --port 8138
hexstrike-arsenal mcp
```

### 8 Native JSON-RPC 2.0 MCP Tools (`mcp_server.py`)
1. `hexstrike_list_tools`
2. `hexstrike_generate_cmd`
3. `hexstrike_port_scan`
4. `hexstrike_target_intel`
5. `hexstrike_generate_report`
6. `hexstrike_audit_headers`
7. `hexstrike_shannon_entropy`
8. `hexstrike_audit_repo`

---

## Testing & Verification

```bash
pytest -q tests/test_hexstrike.py
```

Optional FastAPI backend dependencies live in `backend/requirements.txt` (standalone `server.py`, `cli.py`, and `mcp_server.py` require only the Python 3 standard library).

---

Engineered by Neal Frazier Tech ([@1nc0gn30](https://github.com/1nc0gn30/NullAI-HexStrike-AI-Terminal)) • [NullAI Platform](https://nullai.tech) • [☕ Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`
