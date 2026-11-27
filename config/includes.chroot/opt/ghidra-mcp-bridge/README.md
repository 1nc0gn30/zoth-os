<div align="center">
  <img src="assets/hero-banner.svg" alt="GhidraMCP Binary Reverse Engineering Bridge v3.6.0 Banner" width="100%" />
</div>

<br />

# GhidraMCP Binary Reverse Engineering Bridge (`ghidra-mcp-bridge` v3.6.0)

Local-first Model Context Protocol (`MCP 2024-11-05`) binary reverse engineering bridge, pure-Python ELF/PE/Mach-O/WASM header & Shannon entropy parser, and dual-theme loopback workstation (`127.0.0.1:8131`). Inspired by [LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP) and maintained for Zoth Studio v2 and ZothOS by **Neal Frazier Tech (`@1nc0gn30`) • NullAI Platform**.

---

## Architecture & Security Model

| Property | Specification |
| :--- | :--- |
| **Tool ID & Version** | `ghidra-mcp-bridge` · `v3.6.0` |
| **Category** | `Security & Enclave` |
| **Loopback Daemon** | `http://127.0.0.1:8131` (on-demand `ThreadingHTTPServer`, zero third-party Python dependencies) |
| **Studio Route** | `http://127.0.0.1:3000/tools/ghidra-mcp-bridge` |
| **CLI & TUI Binaries** | `/usr/local/bin/ghidra-mcp-bridge` (`ghidra-bridge`, `ghidra-mcp`), `/usr/local/bin/ghidra-mcp-bridge-tui` |
| **Analysis Engines** | Pure-Python `struct` ELF32/ELF64/PE32/PE32+/Mach-O/WASM parser, NSA Ghidra Headless (`analyzeHeadless`), Radare2 (`r2`), GNU Binutils (`objdump`, `readelf`, `nm`, `strings`), `agent-capsule-jail` |
| **MCP Transports** | HTTP `POST /api/mcp` and CLI stdio `ghidra-mcp-bridge mcp` (`JSON-RPC 2.0`, `protocolVersion: 2024-11-05`, 8 tools) |
| **Security Guards** | Loopback-only `Host` (`403`), exact-port loopback CORS `Origin` allowlist (`403`, zero `ACAO: *`, `Vary: Origin`), all 4 HTTP security headers, disabled directory listings (`403`), `1 MiB` POST cap (`413`), strict symbol regex allowlist (`^[A-Za-z0-9_.@:$+-]{1,128}$`), executable magic-byte verification |
| **License** | MIT · 100% Free & Open Access (Zero Paywalls) |

---

## Core Capabilities

- **Pure-Python Multi-Format Binary Parser**: Inspects ELF32, ELF64, PE32, PE32+, Mach-O 32/64-bit, and WASM headers and section tables directly via `struct`, rejecting plaintext or non-executable files.
- **Per-Section & Whole-File Shannon Entropy**: Computes exact `0.00–8.00 bits/byte` entropy per section and flags `>= 7.0 bits/byte` regions as `PACKED / ENCRYPTED`.
- **Bounded 16-Byte Hex + ASCII Dump**: Exposes `/api/hex`, CLI `hex`, and MCP `read_hex_dump` with offset and length validation (`16–4096` bytes).
- **Multi-Engine Disassembly & Decompilation**: Supports Intel/AT&T disassembly (`r2 pdf` / `objdump`) and C pseudocode recovery (`r2 pdc`, NSA Ghidra `analyzeHeadless`, or AST fallback).
- **Persistent Session Variable Annotations**: `annotate_variable` applies whole-word renames (`\b<old>\b -> <new>`) plus an annotation header comment directly in subsequent `decompile_function` and `disassemble_function` outputs.
- **Dual-Theme Zero-Egress Web Workstation**: Editorial Ivory Light and Obsidian Gold Dark themes (`?theme=light|dark`, `?embed=1`, `prefers-color-scheme`) with zero external CDN requests.

---

## REST API Endpoints (`127.0.0.1:8131`)

- `GET` / `HEAD /health`, `/api/health`, `/api/status`, `/api/tools`, `/api/programs`
- `GET` / `HEAD /api/sections?program=<id_or_path>` and `/api/entropy?program=<id_or_path>`
- `GET /api/hex?program=<id_or_path>&offset=0&length=256`
- `GET /api/inspect?program=<id_or_path>`
- `GET /api/methods?program=<id_or_path>&filter=<query>`
- `GET /api/disassemble?program=<id_or_path>&fn=<symbol>&syntax=<intel|att>`
- `GET /api/decompile?program=<id_or_path>&fn=<symbol>&engine=<auto|r2|ghidra>`
- `GET /api/strings?program=<id_or_path>&query=<q>&min_len=4`
- `GET /api/xrefs?program=<id_or_path>&target=<symbol>`
- `POST /api/mcp` (JSON-RPC 2.0 MCP endpoint)

---

## Model Context Protocol (MCP) — 8 Registered Tools

Available over both HTTP (`POST http://127.0.0.1:8131/api/mcp`) and stdio (`ghidra-mcp-bridge mcp`):

1. `list_methods` — Enumerate exported, internal, and dynamic function symbols.
2. `decompile_function` — Decompile function to C pseudocode AST with active annotations applied.
3. `disassemble_function` — Disassemble function to Intel or AT&T native instructions.
4. `search_strings` — Extract ASCII/UTF-8 strings with hexadecimal file offsets.
5. `get_xrefs` — Find callers and cross-references to a symbol or address.
6. `annotate_variable` — Rename a variable in session store and reflect it in decompile/disassembly output.
7. `inspect_sections_and_entropy` — Parse binary headers, section table, and per-section Shannon entropy.
8. `read_hex_dump` — Read a bounded 16-byte-per-line hex and ASCII dump.

---

## ZothOS CLI & TUI Commands

```bash
# Status, JSON telemetry, and workbench URLs
ghidra-mcp-bridge --status
ghidra-mcp-bridge --json
ghidra-mcp-bridge --ui

# Real binary inspection, sections, entropy, and hex dump
ghidra-mcp-bridge analyze /bin/echo --methods --strings POSIX
ghidra-mcp-bridge sections /bin/echo
ghidra-mcp-bridge entropy /bin/echo
ghidra-mcp-bridge hex /bin/echo --offset 0 --length 128

# Disassembly, decompilation, strings, and cross-references
ghidra-mcp-bridge disasm /bin/echo main --syntax intel
ghidra-mcp-bridge decompile /bin/echo main --engine auto
ghidra-mcp-bridge strings /bin/echo --query POSIX
ghidra-mcp-bridge xrefs /bin/echo getenv

# Start loopback HTTP daemon or stdio MCP server
ghidra-mcp-bridge serve --host 127.0.0.1 --port 8131
ghidra-mcp-bridge mcp

# Real toolchain & binary telemetry TUI
ghidra-mcp-bridge-tui --status
ghidra-mcp-bridge-tui --status --json
```

---

## Tests

```bash
PYTHONPATH=. /opt/zothos-ai-env/bin/pytest -q
```

---

## Support & Attribution

GhidraMCP Binary Reverse Engineering Bridge is 100% free and open-access software with zero paywalls. Optional support:

- **Stripe**: [☕ Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- **Solana Tip**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` (`solana:GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`)

MIT License — **Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform** ([GitHub](https://github.com/1nc0gn30/ghidra-mcp-bridge) · [nullai.tech](https://nullai.tech)).
