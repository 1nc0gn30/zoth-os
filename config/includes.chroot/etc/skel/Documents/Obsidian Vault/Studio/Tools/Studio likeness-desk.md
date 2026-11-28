---
title: "Likeness Desk"
tags: [studio, tool, verified, open-access, mcp]
aliases: ["likeness-desk", "Likeness Desk", "Likeness Desk (AI Video Double)"]
pillar: "Pillar IV: Real-Time Audio-Visual & Generative Synthesis"
category: "Voice & Real-Time"
version: "2.6.0"
runs: "on-demand-daemon"
monetized: false
price: "$0 (100% Free & Open-Access, MIT)"
status: "active"
verified: true
tested_at: "2026-11-27"
test_status: "PASS (v2.6.0 — 24 pytest + 10 Studio engine tests)"
local_port: 9395
cli_binary: "likeness-desk"
mcp_tools: ["likeness_status", "likeness_mouth_roi", "likeness_speak", "likeness_diagnostics"]
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/likeness-desk"
live_url: "http://127.0.0.1:9395"
studio_url: "http://127.0.0.1:3000/tools/likeness-desk"
braille_shape: "orbit"
braille_archetype: "Elliptical N-Body Particle Orbit"
---

# Likeness Desk (AI Video Double) — `v2.6.0`

> [!CHECK] Whiteboard Remediation & Re-Audit Verified (`v2.6.0`)
> **Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform**
> Verified across standalone `:9395`, Zoth Studio v2 `/tools/likeness-desk`, ZothOS chroot `/opt/likeness-desk`, 4-way CLI/TUI parity, 3-way `.desktop` parity, and 4-tool JSON-RPC 2.0 stdio MCP server (`24 passed` in `pytest` + `10 passed` in `test-likeness-desk-engine.mjs`, `0` secrets, `0` biometric files in ZothOS ISO chroot, triple-viewport × dual-theme Light/Dark verified with `overflowPx: 0` and `consoleErrors: 0`).

---

## Tool Overview & Verified Contracts

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `likeness-desk` (`v2.6.0`) |
| **Category** | `Voice & Real-Time` |
| **Runtime Engine** | Node.js loopback coordinator (`127.0.0.1:9395`) + Chatterbox Turbo CPU voice worker (`:9396`) + Wav2Lip CUDA face worker (`:9397`) |
| **Safe On-Demand Mode** | `LIKENESS_LAZY_GPU=1` (enforced by Studio `/api/studio/tool/wake` & Electron by default so browsing never warms CUDA) |
| **Local Port & URL** | `:9395` • [http://127.0.0.1:9395](http://127.0.0.1:9395) |
| **Studio Route** | [http://127.0.0.1:3000/tools/likeness-desk](http://127.0.0.1:3000/tools/likeness-desk) (`?embed=1&theme=` synced) |
| **4-Way CLI / TUI Binaries** | `/usr/local/bin/likeness-desk`, `~/.local/bin/likeness-desk`, `~/NullAITech/likeness-desk/bin/likeness-desk`, chroot `/usr/local/bin/likeness-desk` (+ `likeness` alias & `likeness-desk-tui`) |
| **Stdio MCP Server** | `likeness-desk mcp` (`bin/likeness-desk-mcp`): `likeness_status`, `likeness_mouth_roi`, `likeness_speak`, `likeness_diagnostics` |
| **GitHub Repository** | [https://github.com/1nc0gn30/likeness-desk](https://github.com/1nc0gn30/likeness-desk) |
| **License & Pricing** | MIT License — **100% Free & Open-Access** ($0, zero paywalls) |
| **Optional Support** | [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Security, Privacy & Honest Optional Egress

1. **Zero Personal Biometrics in Git or ISO Chroot**: Personal voice clips (`reference.wav`), portraits (`portrait.jpg`), motion takes (`idle.webm`/`motion.webm`), and `profile.json` stay strictly in gitignored `~/NullAITech/likeness-desk/data/` (overridable via `LIKENESS_DATA_DIR`). ZothOS chroot `/opt/likeness-desk/data/` ships empty (`.gitkeep` only) and is enforced by `zoth-os/tests/test_zoth_os_hygiene.py`.
2. **Loopback Hardening (`server.js` `v2.6.0`)**:
   - Strict `Host` allowlist (`127.0.0.1`, `localhost`, `[::1]` with active port; `403` on DNS-rebinding hosts).
   - Exact-port `Origin` allowlist (`:9395` and Studio `:3000`; `403` on foreign or arbitrary loopback ports like `:9999`), emitting `Access-Control-Allow-Origin` + `Vary: Origin` on `OPTIONS`, `GET`, `HEAD`, and `POST`.
   - Emits `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and loopback `Content-Security-Policy` on every response.
   - Clean HTTP `413 Payload Too Large` without TCP resets, `HEAD` `200`, WebM EBML magic-byte (`0x1A 0x45 0xDF 0xA3`) validation, normalized mouth ROI bounds (`x+w <= 1`, `y+h <= 1`), unique temp upload files, `30s` `ffmpeg` timeouts, and `SIGINT`/`SIGTERM` worker cleanup.
   - `POST /api/speak` JSON honestly returns `mode: "lazy_preview", synthesized: false` when `LIKENESS_LAZY_GPU=1` is active (never claims fake `"SYNTHESIZED"`).
3. **Honest Optional Network Egress**:
   - Voice cloning and Wav2Lip rendering execute 100% locally.
   - Optional conversational chat (`POST /api/chat`, model configurable via `LIKENESS_CHAT_MODEL`) contacts `api.x.ai` **only** when `XAI_API_KEY` is explicitly configured in the host environment.
   - The optional browser `Listen` button uses the browser's `SpeechRecognition` API if invoked.

---

## CLI, TUI & MCP Commands

```bash
# Safe lazy-GPU local start (no heavy CUDA boot)
LIKENESS_LAZY_GPU=1 likeness-desk serve --port 9395

# Status, redacted JSON telemetry (zero literal user home paths), and URL
likeness-desk --status
likeness-desk --json
likeness-desk --ui

# Real-status Unicode Braille TUI
likeness-desk-tui --status

# Zero-dependency JSON-RPC 2.0 stdio MCP server (4 tools)
likeness-desk mcp
```

---

## Verification Matrix (`v2.6.0`)

| Check | Command / Surface | Observed Result | Status |
| :--- | :--- | :--- | :---: |
| **Repo Pytest Suite** | `LIKENESS_LAZY_GPU=1 python3 -m pytest -v` | `24 passed` (`0` warnings) | PASS |
| **Studio Engine Tests** | `node --test scripts/test-likeness-desk-engine.mjs` | `10 passed` | PASS |
| **ZothOS Hygiene Tests** | `pytest -q tests/test_zoth_os_hygiene.py` | Chroot biometric-free + parity verified | PASS |
| **Secret Scans** | `gitleaks detect` & `scan-secrets.sh` | `0 leaks` | PASS |
| **Dual-Theme & Triple-Viewport** | Standalone `:9395` + Studio `/tools/likeness-desk` (`390px`, `820px`, `1440px` × Light/Dark) | `overflowPx: 0`, `consoleErrors: 0`, WCAG AA `>= 4.5:1` | PASS |

---

## Connected Canon Notes

[[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
