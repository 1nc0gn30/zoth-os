---
title: "GhidraMCP Binary Reverse Engineering Bridge"
tags: [studio, tool, verified, open-access, reverse-engineering, security]
aliases: ["ghidra-mcp-bridge", "GhidraMCP Binary Reverse Engineering Bridge"]
pillar: "Pillar I: Cryptography & Security Protocols"
category: "Security & Enclave"
runs: "node"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-11-08"
test_status: "PASS (19 Real Dynamic Tests Passed)"
local_port: 8131
cli_binary: "ghidra-mcp-bridge"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/ghidra-mcp-bridge"
live_url: "http://127.0.0.1:8131"
studio_url: "http://127.0.0.1:3000/tools/ghidra-mcp-bridge"
braille_archetype: "Dissolved Instruction Stream & Hex Mesh"
version: "3.5.0"
---

# 🛡️ GhidraMCP Binary Reverse Engineering Bridge (`ghidra-mcp-bridge`)

> **100% Free & Open-Access Sovereign Tool** — Zero paywalls, zero blur locks, zero license modals. Support via [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## 1. Executive Summary & Capabilities

**GhidraMCP Binary Reverse Engineering Bridge** (`v3.5.0`) implements a production-grade binary analysis and decompilation engine conforming to the Model Context Protocol (MCP `2024-11-05`). It bridges autonomous LLM agents and human security researchers with real reverse engineering engines on Linux:

- **Dynamic Multi-Engine Binary Disassembly & Decompilation**:
  - **NSA Ghidra Headless** (`/usr/share/ghidra/support/analyzeHeadless`)
  - **Radare2 / r2** (`pdc` C pseudocode decompilation, `axt` xref analysis, `afl` function recovery)
  - **GNU Binutils** (`readelf`, `objdump`, `nm`, `strings -a -t x`)
  - **Agent Capsule Jail** (`agent-capsule-jail` bubblewrap sandboxing with memory limits)
- **Arbitrary Binary Analysis**: Analyzes system binaries (`/bin/echo`, `/bin/ls`, `/bin/bash`), firmware binaries, and stripped ELF/PE/Mach-O executables.
- **REST Daemon & MCP Protocol Bridge (`:8131`)**: Exposes REST endpoints (`/api/inspect`, `/api/methods`, `/api/decompile`, `/api/disassemble`, `/api/strings`, `/api/xrefs`) and standard JSON-RPC 2.0 MCP tools.
- **Zoth Studio v2 God-Mode**: Integrated at `http://127.0.0.1:3000/tools/ghidra-mcp-bridge` with live target selector and interactive C pseudocode view.
- **Global ZothOS CLI**: `/usr/local/bin/ghidra-mcp-bridge` and `ghidra-bridge`.

---

## 2. CLI Subcommands & Usage

```bash
# Analyze any arbitrary ELF/PE binary
ghidra-mcp-bridge analyze /bin/echo --methods --strings

# Decompile a function to C pseudocode
ghidra-mcp-bridge decompile /bin/echo main --engine r2

# Disassemble a function with Intel syntax
ghidra-mcp-bridge disasm /bin/echo main --syntax intel

# Extract strings with hex file offsets
ghidra-mcp-bridge strings /bin/echo --query "usage"

# Inspect cross-references to a symbol
ghidra-mcp-bridge xrefs /bin/echo exit
```

---

## 3. Verification & Testing

- **Pytest Suite**: `19 passed in 3.57s` (`tests/test_ghidra_mcp_bridge.py`), covering real execution on `/bin/echo` and `/bin/ls`.
- **Tri-Viewport Guardrail**: `capture.mjs` verified with zero errors across mobile, tablet, and desktop viewports.
- **Git Commit**: `534818c` (`feat(ghidra-mcp-bridge): upgrade to real binary analysis, decompilation engine and CLI`)
