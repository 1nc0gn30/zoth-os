---
title: "EnvGuard Secrets Vault"
tags: [studio, tool, verified, open-access, v2.6.0]
aliases: ["envguard-secrets-vault", "EnvGuard Secrets Vault"]
pillar: "Pillar I: Cryptography & Security Protocols"
category: "Security & Recon"
version: "2.6.0"
runs: "browser+daemon"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-11-26"
test_status: "PASS (v2.6.0 Hardened Remediation)"
local_port: 8088
cli_binary: "envguard-secrets-vault"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/envguard-secrets-vault"
live_url: "http://127.0.0.1:8088"
studio_url: "http://127.0.0.1:3000/tools/envguard-secrets-vault"
braille_shape: "astrolabe"
braille_archetype: "Sacred Orbital Armillary Sphere"
---

# EnvGuard Secrets Vault (`v2.6.0`)

> [!CHECK] Verified Open-Access Security Workstation (`v2.6.0`)
> **Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform**
> Hardened loopback Python daemon (`127.0.0.1:8088` via `/opt/envguard-secrets-vault` user systemd unit), Dual-Theme WebCrypto Studio, Zoth Studio v2 God-Mode Deck (`/tools/envguard-secrets-vault`), 4-way ZothOS CLI & Braille TUI parity, and 11 native JSON-RPC 2.0 stdio MCP tools.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `envguard-secrets-vault` (`v2.6.0`) |
| **Category** | `Security & Recon` |
| **Runtime Engine** | Pure Python 3 Standard Library HTTP/MCP Daemon + Web Crypto API |
| **Cryptography** | `PBKDF2-HMAC-SHA256` (`600,000` default, bounded `[100,000, 2,000,000]`) + `AES-256-CTR` (128-bit counter, NIST FIPS 197) + `HMAC-SHA256` Encrypt-then-MAC |
| **Quorum Engine** | GF(256) Shamir `(k, n)` threshold splitting with mandatory SHA-256 share checksum verification |
| **Local Port & URL** | `:8088` • [http://127.0.0.1:8088](http://127.0.0.1:8088) |
| **Studio Route** | [http://127.0.0.1:3000/tools/envguard-secrets-vault](http://127.0.0.1:3000/tools/envguard-secrets-vault) |
| **Systemd Unit** | `~/.config/systemd/user/envguard-secrets-vault.service` -> `/opt/envguard-secrets-vault/server.py` |
| **CLI & TUI Binaries** | `/usr/local/bin/envguard-secrets-vault` · `/usr/local/bin/envguard-secrets-vault-tui` |
| **GitHub Repository** | [https://github.com/1nc0gn30/envguard-secrets-vault](https://github.com/1nc0gn30/envguard-secrets-vault) |
| **License & Pricing** | MIT — 100% Free & Open-Access ($0) |
| **Optional Support** | [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Package Architecture (`src/envguard_secrets_vault/`)

- `scanner.py` & `entropy_analyzer.py`: Provider regex detectors, frontend client-bundle exposure rules (`NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`), and Shannon entropy heuristics.
- `mcp_server.py` & `vault.py`: Canonical pure-Python NIST FIPS 197 `AES-256-CTR` + `PBKDF2-HMAC-SHA256` + `HMAC-SHA256` Encrypt-then-MAC engine and 11-tool JSON-RPC 2.0 stdio MCP server.
- `shamir_quorum.py`: GF(256) polynomial `(k, n)` threshold secret splitting and Lagrange reconstruction with embedded SHA-256 share checksum verification.
- `secret_rotation_sentinel.py`: `# @created`, `# @expires`, and `# @rotation_days` lifecycle audit and key rotation diff generator.
- `ui_server.py` & `server.py`: Loopback-hardened REST & static server (`127.0.0.1:8088`) enforcing loopback `Host` validation, exact-port CORS `Origin` allowlists, `1 MiB` body cap (`413`), strict JSON/param validation (`400`), disabled directory listings (`403`), `HEAD` support, HTTP security headers, and zero HTTP host filesystem `path` access.
- `ci_gate.py`, `transformer.py`, `compat.py`, `cli.py`: Pre-commit CI gate, variable masker, `.env.example` synthesizer, atomic file helpers, and CLI entrypoint.

## Verified CLI, TUI & MCP Commands

```bash
# CLI subcommands (preserves caller working directory)
envguard-secrets-vault scan .env --json --min-score 80
envguard-secrets-vault mask .env --mode partial
envguard-secrets-vault example .env --output .env.example
envguard-secrets-vault encrypt .env --out .env.enc
envguard-secrets-vault decrypt .env.enc --out .env.restored
envguard-secrets-vault shamir split "MASTER_KEY" -k 3 -n 5 --json
envguard-secrets-vault rotate .env --audit-only --json
envguard-secrets-vault test
envguard-secrets-vault --json

# Live Braille telemetry TUI
envguard-secrets-vault-tui --once --json

# Stdio MCP server (11 tools)
python3 -m envguard_secrets_vault mcp
```

### 11 Registered Stdio MCP Tools
`env_scan_secrets`, `env_mask_variables`, `env_generate_example`, `env_vault_encrypt`, `env_vault_decrypt`, `env_diff_environments`, `env_get_diagnostics`, `env_shamir_split`, `env_shamir_combine`, `env_audit_rotation`, `env_rotate_secrets`.

## Studio & Standalone Surfaces

Both `http://127.0.0.1:8088` and the Studio God-Mode Deck (`EnvGuardVaultGodModeTool.jsx` backed by `src/utils/envguardEngine.js`) support **Editorial Ivory Light** and **Obsidian Gold Dark** themes (`>= 4.5:1` WCAG AA) across 5 working tabs:
1. Secret Scanner & Entropy
2. PBKDF2 + AES-256-CTR-HMAC Vault (byte-for-byte Python ↔ WebCrypto interoperable)
3. Credential Masker, `.env.example` & `.env` Diff (+ Hardened ZIP Export)
4. GF(256) Shamir `(k, n)` Quorum & TTL Rotation Sentinel
5. MCP Server (11 Tools) & CLI Reference

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
