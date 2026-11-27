---
title: "GhidraMCP Binary Reverse Engineering Bridge"
tags: [studio, tool, verified, open-access, reverse-engineering, security]
aliases: ["ghidra-mcp-bridge", "GhidraMCP Binary Reverse Engineering Bridge"]
pillar: "Pillar I: Cryptography & Security Protocols"
category: "Security & Enclave"
runs: "python3"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-11-27"
test_status: "PASS (v3.6.0 Security, Binary Parser, MCP & WCAG Suite)"
local_port: 8131
cli_binary: "ghidra-mcp-bridge"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/ghidra-mcp-bridge"
live_url: "http://127.0.0.1:8131"
studio_url: "http://127.0.0.1:3000/tools/ghidra-mcp-bridge"
braille_archetype: "Hexagonal CFG Lattice & Shannon Entropy Binary Engine"
version: "3.6.0"
---

# GhidraMCP Binary Reverse Engineering Bridge (`ghidra-mcp-bridge` v3.6.0)

> **100% Free & Open-Access Tool** — Zero paywalls, zero blur locks, zero license modals. Support via [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## 1. Architecture & Capabilities (`v3.6.0`)

**GhidraMCP Binary Reverse Engineering Bridge** (`v3.6.0`, Python 3 standard library, inspired by LaurieWired/GhidraMCP) bridges local binary reverse engineering toolchains and pure-Python binary parsers over HTTP (`127.0.0.1:8131`) and CLI stdio JSON-RPC 2.0 MCP (`2024-11-05`):

- **Pure-Python ELF32/ELF64, PE32/PE32+, Mach-O & WASM Parsers**: Extracts format, architecture, entry point, section tables, and per-section Shannon entropy (`0.00–8.00 bits/byte`, flagging `>= 7.0` as `PACKED / ENCRYPTED`), rejecting non-executable plaintext files.
- **Bounded 16-Byte Hex + ASCII Dump**: Served via `/api/hex`, CLI `hex`, and MCP `read_hex_dump`.
- **Host Reverse Engineering Toolchains**: NSA Ghidra Headless (`/usr/share/ghidra/support/analyzeHeadless`), Radare2 (`pdf`, `pdc`, `axt`, `afl`), GNU Binutils (`readelf`, `objdump`, `nm`, `strings`), and optional `agent-capsule-jail` isolation.
- **8 Spec-Compliant JSON-RPC 2.0 MCP Tools**: `list_methods`, `decompile_function`, `disassemble_function`, `search_strings`, `get_xrefs`, `annotate_variable` (persisted and applied to subsequent decompile/disasm output), `inspect_sections_and_entropy`, and `read_hex_dump`.
- **Hardened Loopback Daemon (`:8131`)**: `ThreadingHTTPServer`, strict loopback `Host` & exact-port CORS `Origin` `403` guards, all 4 HTTP security headers, disabled directory listings (`403`), `1 MiB` POST body cap (`413`), strict symbol regex allowlist, and dual-theme Editorial Ivory Light + Obsidian Gold Dark UI.
- **Studio God-Mode Deck (`/tools/ghidra-mcp-bridge`)**: In-browser pure-JS ELF/PE/Mach-O/WASM file dropzone, Shannon entropy table, hex dump, variable annotation editor, and loopback-only `:8131` probe.

---

## 2. CLI, TUI & MCP Usage

```bash
# Status and JSON telemetry
ghidra-mcp-bridge --status
ghidra-mcp-bridge --json
ghidra-mcp-bridge --ui

# Sections, Shannon entropy, and hex dump
ghidra-mcp-bridge sections /bin/echo
ghidra-mcp-bridge entropy /bin/echo
ghidra-mcp-bridge hex /bin/echo --offset 0 --length 128

# Disassembly, decompilation, strings, and cross-references
ghidra-mcp-bridge disasm /bin/echo main --syntax intel
ghidra-mcp-bridge decompile /bin/echo main --engine auto
ghidra-mcp-bridge strings /bin/echo --query POSIX
ghidra-mcp-bridge xrefs /bin/echo getenv

# Start loopback daemon or stdio MCP server
ghidra-mcp-bridge serve --host 127.0.0.1 --port 8131
ghidra-mcp-bridge mcp

# Real toolchain telemetry TUI
ghidra-mcp-bridge-tui --status --json
```

---

## 3. Attribution

Engineered by Neal Frazier Tech (`@1nc0gn30`) • NullAI Platform.
