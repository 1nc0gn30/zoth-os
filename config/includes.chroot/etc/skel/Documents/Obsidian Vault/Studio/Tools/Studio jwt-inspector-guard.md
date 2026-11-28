---
title: "JWT Inspector Guard"
tags: [studio, tool, verified, open-access]
aliases: ["jwt-inspector-guard", "JWT Inspector Guard"]
pillar: "Pillar I: Cryptography & Security Protocols"
category: "Security & Recon"
runs: "browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-11-27"
test_status: "PASS (v2.6.0 Hardened Re-Audit)"
local_port: 8124
cli_binary: "jwt-inspector-guard"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/jwt-inspector-guard"
live_url: "http://127.0.0.1:8124"
studio_url: "http://127.0.0.1:3000/tools/jwt-inspector-guard"
---

# JWT Inspector Guard (`v2.6.0`)

> [!CHECK] v2.6.0 Hardened Verification Passed (100% Free & Open-Access)
> **Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform**
> Verified across standalone `:8124` loopback daemon, Zoth Studio v2 `:3000/tools/jwt-inspector-guard`, ZothOS CLI/TUI/Chroot `/opt/jwt-inspector-guard`, and 11-tool JSON-RPC 2.0 MCP stdio server. Zero external CDN egress, zero paywalls, zero license modals, and zero literal home paths.

---

## Tool Overview & Architecture

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `jwt-inspector-guard` (`v2.6.0`) |
| **Category** | `Security & Recon` |
| **Runtime Engine** | Pure Python 3 Standard Library (`src/jwt_inspector_guard/`) + Browser Web Crypto API |
| **Core Modules** | `base64_url.py`, `token_parser.py`, `crypto_engine.py`, `claims_validator.py`, `security_linter.py`, `dpop_guard.py`, `jwks_manager.py`, `timing_defense.py`, `catalog.py`, `ui_server.py`, `mcp_server.py`, `cli.py` |
| **Loopback Server** | On-Demand `http://127.0.0.1:8124` (`python3 server.py --port 8124`) |
| **Studio Route** | `http://127.0.0.1:3000/tools/jwt-inspector-guard` |
| **CLI & TUI Binaries** | `/usr/local/bin/jwt-inspector-guard`, `~/.local/bin/jwt-inspector-guard`, `/usr/local/bin/jwt-inspector-guard-tui` |
| **Chroot Runtime** | `/opt/jwt-inspector-guard` (lean `< 1 MiB` staging) |
| **GitHub Repository** | [https://github.com/1nc0gn30/jwt-inspector-guard](https://github.com/1nc0gn30/jwt-inspector-guard) |
| **License & Support** | MIT • 100% Free & Open-Access • [Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • SOL: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Verified CLI, REST & MCP Commands

### 1. CLI Subcommands
```bash
# Platform & cryptographic diagnostics (redacted paths)
jwt-inspector-guard --json
jwt-inspector-guard --status

# Sample catalog (25 presets) & token inspection
jwt-inspector-guard samples --no-color -q
jwt-inspector-guard decode <JWT_TOKEN> --json

# Fail-closed verification (alg:none rejected unless --allow-none is explicitly passed)
jwt-inspector-guard verify <JWT_TOKEN> -s <SECRET> --json
jwt-inspector-guard audit <JWT_TOKEN> -s <SECRET> --json
jwt-inspector-guard crack <JWT_TOKEN> --json

# RFC 9449 ECDSA P-256 (ES256) DPoP proofs, RFC 7517 JWKS & empirical timing benchmarks
jwt-inspector-guard dpop-create --method POST --url https://api.example.com/v1/payments --json
jwt-inspector-guard dpop-verify <PROOF_JWT> --method POST --url https://api.example.com/v1/payments --json
jwt-inspector-guard jwks --rotate --json
jwt-inspector-guard timing --trials 40 --json

# Unified hardened loopback web server & Braille telemetry TUI
jwt-inspector-guard serve --host 127.0.0.1 --port 8124 --no-browser
jwt-inspector-guard-tui --status
jwt-inspector-guard-tui --json
```

### 2. Loopback REST API (`127.0.0.1:8124`)
- `GET` / `HEAD` `/`, `/health`, `/api/health`, `/api/catalog`, `/api/diagnostics`, `/robots.txt`, `/sitemap.xml`
- `POST` `/api/decode`, `/api/verify`, `/api/validate`, `/api/audit`, `/api/inspect`, `/api/catalog`, `/api/crack`, `/api/mint`, `/api/entropy`, `/api/tamper`, `/api/jwks`, `/api/timing`, `/api/dpop/create`, `/api/dpop/verify`
- Enforces strict loopback `Host` (`403`), exact-port `Origin` (`403`), 4 security headers + loopback CSP, `Cache-Control: no-store` on `/api/*`, `1 MiB` body cap (`413`), and strict JSON/numeric validation (`400`).

### 3. 11 JSON-RPC 2.0 MCP Stdio Tools (`jwt-inspector-guard mcp`)
1. `jwt_decode`
2. `jwt_verify`
3. `jwt_encode`
4. `jwt_audit_security`
5. `jwt_crack_secret`
6. `jwt_list_samples`
7. `jwt_diagnostics`
8. `jwt_audit_jwks`
9. `jwt_timing_defense_audit`
10. `jwt_create_dpop_proof`
11. `jwt_verify_dpop_proof`

---

## Connected Canon Notes
[[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[Zoth Memory]] · [[Public Surfaces]]
