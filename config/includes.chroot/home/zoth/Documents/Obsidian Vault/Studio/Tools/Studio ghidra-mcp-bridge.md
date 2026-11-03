---
tool_id: "ghidra-mcp-bridge"
name: "GhidraMCP Binary Reverse Engineering Bridge"
category: "Security & Enclave"
version: "3.5.0"
local_port: 8131
studio_route: "http://127.0.0.1:3000/tools/ghidra-mcp-bridge"
standalone_url: "http://127.0.0.1:8131/"
cli_binary: "/usr/local/bin/ghidra-mcp-bridge"
repo_path: "/home/zoth/NullAITech/ghidra-mcp-bridge"
test_status: "PASS (12-Step Gallery Verified)"
access_model: "100% Free & Open-Access (Zero Paywalls)"
last_verified: "2026-10-31"
---

# GhidraMCP Binary Reverse Engineering Bridge (`ghidra-mcp-bridge`)

> **100% Free & Open-Access Sovereign Tool** — Zero paywalls, zero blur locks, zero license modals. Support via [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

## 1. Executive Summary & Architecture

**GhidraMCP Binary Reverse Engineering Bridge** (`v3.5.0`) implements the LaurieWired Model Context Protocol (MCP) specification (`2024-11-05`) for the NSA Ghidra decompiler. It empowers autonomous LLM agents and reverse engineers to inspect native x86_64 ELF and ARM Cortex-M4 (Thumb-2) binaries, decompile functions into C pseudocode ASTs, enumerate instruction disassembly streams, extract string cross-references, and annotate local stack/register variables.

- **Standalone Daemon & Web Workstation**: `http://127.0.0.1:8131/` (`server.py`)
- **Zoth Studio v2 God-Mode Route**: `http://127.0.0.1:3000/tools/ghidra-mcp-bridge` (`GhidraMcpGodModeTool.jsx`)
- **Global ZothOS CLI**: `/usr/local/bin/ghidra-mcp-bridge` & `/home/zoth/.local/bin/ghidra-mcp-bridge`
- **Automated Pytest Suite**: `8 passed in 0.16s` (`tests/test_ghidra_mcp_bridge.py`)

---

## 2. Step-by-Step Developer & End-User Walkthrough Gallery (12 Real Screenshots)

### Phase A: Developer Perspective (Architecture, Pytest Suite & JSON-RPC 2.0 MCP Contracts)

#### Step 1 — Developer Repository Architecture & Binary Decompilation Database
Inspecting `/home/zoth/NullAITech/ghidra-mcp-bridge` layout (`server.py`, `public/index.html`, `tests/test_ghidra_mcp_bridge.py`) and verifying the indexed `zoth-vault-daemon.elf` (`x86_64`) and `firmware_boot.bin` (`ARM Cortex-M4`) decompilation schemas.

![Step 1: Developer Repository Architecture](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_01_dev_repo_architecture.jpg)

#### Step 2 — Developer Automated Test Suite (`pytest -v`)
Running the 8-test suite (`tests/test_ghidra_mcp_bridge.py`) covering `/health`, `/api/status`, `/api/tools`, `/api/programs`, `/api/decompile`, and `POST /api/mcp` (`tools/list`, `tools/call`) with `8 passed in 0.60s`.

![Step 2: Developer Pytest Suite](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_02_dev_pytest_suite.jpg)

#### Step 3 — Developer REST & JSON-RPC 2.0 MCP Protocol Verification
Executing live `curl` checks against `http://127.0.0.1:8131/health` and invoking `POST /api/mcp` (`tools/call` for `search_strings` on `zoth-vault-daemon`).

![Step 3: Developer REST & MCP Contracts](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_03_dev_api_contracts.jpg)

---

### Phase B: End-User CLI & TUI Perspective (`/usr/local/bin/ghidra-mcp-bridge`)

#### Step 4 — End-User CLI Installation, `--help` & MCP Tool Registry (`tools`)
Verifying global ZothOS binary paths (`which -a ghidra-mcp-bridge`), subcommand help (`decompile`, `tools`, `programs`, `serve`), and enumerating the 4 registered MCP tools (`list_methods`, `decompile_function`, `search_strings`, `annotate_variable`).

![Step 4: End-User CLI Help & Tools](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_04_user_cli_help_and_tools.jpg)

#### Step 5 — End-User CLI Binary Catalog (`programs`) & `x86_64` Decompilation (`decompile`)
Listing indexed ELF/ARM targets (`ghidra-mcp-bridge programs`) and decompiling `zoth-vault-daemon` function `argon2id_kdf_derive` (`0x00401340`, 256 bytes) directly in the terminal.

![Step 5: End-User CLI x86_64 Decompilation](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_05_user_cli_decompile_x86.jpg)

#### Step 6 — End-User CLI ARM Cortex-M4 Firmware Decompilation (`Reset_Handler`)
Decompiling the microcontroller flash target `firmware-auth-arm` (`firmware_boot.bin`) entry handler `Reset_Handler` (`0x08000100`, 96 bytes) via CLI.

![Step 6: End-User CLI ARM Cortex-M4 Decompilation](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_06_user_cli_decompile_arm_json.jpg)

---

### Phase C: End-User Standalone Web Workstation (`http://127.0.0.1:8131/`)

#### Step 7 — Standalone Workstation: `x86_64` ELF `main()` Disassembly & Decompiled C AST
Opening `http://127.0.0.1:8131/` to inspect `zoth-vault-daemon.elf` (`x86_64`) side-by-side Native Disassembly (`0x00401020: endbr64 ...`) and Ghidra Decompiled C Pseudocode (`int main(int argc, char **argv)`).

![Step 7: Standalone x86_64 main() Decompilation](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_07_gui_standalone_x86_main.jpg)

#### Step 8 — Standalone Workstation: `argon2id_kdf_derive()` & Live MCP `search_strings` Stream
Switching the target function to `argon2id_kdf_derive (0x00401340)` and firing the `🏷️ search_strings` MCP action, streaming the JSON-RPC 2.0 response into the bottom Model Context Protocol Stream Log.

![Step 8: Standalone Argon2id & MCP Stream Log](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_08_gui_standalone_argon2id_and_mcp.jpg)

#### Step 9 — Standalone Workstation: ARM Cortex-M4 `firmware_boot.bin` (`Reset_Handler`)
Switching the target binary selector to `firmware_boot.bin (ARM Cortex-M4)` and inspecting Thumb-2 instructions (`ldr r0, =0x20001000`, `msr MSP, r0`, `bl <verify_flash_signature>`) alongside the decompiled `void Reset_Handler(void)` C AST.

![Step 9: Standalone ARM Cortex-M4 Firmware](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_09_gui_standalone_arm_firmware.jpg)

---

### Phase D: Zoth Studio v2 God-Mode & Mobile Responsive Verification

#### Step 10 — Zoth Studio v2 God-Mode (`:3000/tools/ghidra-mcp-bridge`) — Decompiler Pseudocode & AST
Interacting with the Zoth Studio v2 God-Mode workstation, selecting `argon2id_kdf_derive()` (`0x00401340`, 324 bytes) in the Functions panel and inspecting the decompiled C code and local Ghidra MCP server endpoint (`http://127.0.0.1:8080/`).

![Step 10: Zoth Studio v2 God-Mode Decompiler](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_10_gui_studio_godmode_decompiler.jpg)

#### Step 11 — Zoth Studio v2 God-Mode (`:3000/tools/ghidra-mcp-bridge`) — Extracted Strings & Dynamic Imports
Switching to the **Strings, Imports & Exports** tab to inspect extracted ASCII/UTF-8 strings (`0x00403010`–`0x00403080`) and dynamic library linkages (`libsodium.so.23`, `libc.so.6`, `libpthread.so.0`).

![Step 11: Zoth Studio v2 God-Mode Strings & Imports](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_11_gui_studio_godmode_strings_imports.jpg)

#### Step 12 — Mobile Responsive Viewport (`390x844` iPhone 14 Pro)
Verifying zero horizontal scroll overflow (`scrollWidth <= clientWidth === true`), Touch-friendly 44px controls, and stacked disassembly/pseudocode cards on mobile devices.

![Step 12: Mobile 390x844 Responsive View](Artifacts/ghidra-mcp-bridge/ghidra-mcp-bridge_12_gui_mobile_390px.jpg)
