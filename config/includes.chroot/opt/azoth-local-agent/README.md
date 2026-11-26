# AZOTH Local Archon Agent (`azoth-local-agent` v3.1.0)

Hardened local-first autonomous ReAct agent, loopback FastAPI web cockpit (`127.0.0.1:8136`), persistent Playwright browser sandbox, isolated Linux guest container bridge, DuckyScript automation studio, stateful Python REPL, and JSON-RPC 2.0 Model Context Protocol (MCP) stdio server.

---

## What It Does & How It Works

1. **Multi-Engine Inference Routing (`agent.py`, `engines/manager.py`)**:
   - Runs offline against local Ollama (`qwen2.5-coder`, `llama3.1`, `gemma4`) with deterministic offline Archon fallback, or routes tasks across local CLI/API engines (`hermes`, `agy`, `codex`, `grok_cli`, `xai`, `gemini`, `claude`, `openai`, `openrouter`).
2. **Operating Modes (`prompts/modes.py`)**:
   - `regular` (direct technical synthesis), `fun` (informal register), `think` (chain-of-thought extraction + DeepSearch citations), and `coder` (sandbox code generation and verification).
3. **Hardened Loopback Security Architecture (`web_ui.py`, `tools/security.py`)**:
   - Pure ASGI `LoopbackSecurityMiddleware` enforces a strict loopback `Host` allowlist (`127.0.0.1`, `localhost`, `[::1]`, rejecting DNS rebinding and unauthenticated tailnet `Host` headers with `403 JSON`).
   - Strict parsed loopback `Origin` allowlist (`allow_credentials=False`, `Vary: Origin`, rejecting untrusted and port-suffix spoofed origins with `403 JSON`).
   - Per-boot CSPRNG session token (`AZOTH_API_TOKEN`) required via `X-Azoth-Token` or `Authorization: Bearer <token>` on all privileged execution/mutation routes (`/api/vm/*`, `/api/python/*`, `/api/ducky/run`, `/api/config/save`, `/api/workspace/file*`, `/api/browser/*`, `/api/engine/set`, `/api/mode`, and `/ws/terminal` before `websocket.accept()`).
   - Streaming `1 MiB` (`MAX_BODY_BYTES`) request body cap (`413 Payload Too Large`), `Path.resolve().is_relative_to(WORKSPACE_DIR)` containment with symlink escape blocking (`403`), public HTTP/HTTPS SSRF guard (blocking `file://`, loopback, RFC1918, `169.254.0.0/16` IMDS, and `100.64.0.0/10` tailnet), allowlisted `.env` config keys rejecting CR/LF injection, and DOM-sanitized Markdown/HTML rendering.
4. **Persistent Chromium Sandbox & DuckyScript Automation (`tools/browser.py`, `tools/duckyscript.py`)**:
   - Maintains a persistent Chromium profile (`sandbox/browser_profile/`) with interactive live viewport streaming, multi-tab controls, SSRF-guarded navigation, workspace-contained session cookie export/import, and parameterized `.ducky` presets.
5. **Python REPL & Isolated Guest OS (`tools/code_runner.py`, `tools/vm_manager.py`, `tools/terminal_bridge.py`)**:
   - Runs stateful Python sessions inside `sandbox/workspace/` (`0o750`) and manages a Docker/Podman Guest OS container (`docker/Dockerfile.guest_os`) with strict package-name validation (`^[a-zA-Z0-9][a-zA-Z0-9._+-]{0,80}$`) and token-authenticated xterm.js PTY bridge (`/ws/terminal`).
6. **JSON-RPC 2.0 MCP Stdio Server (`mcp_server.py`)**:
   - Exposes `azoth_agent_query` plus 35 native `azoth_*` tools (`36` total) with strict JSON-RPC 2.0 request/params validation (`-32600` / `-32602` / `-32700`).

---

## Installation & Quick Start

```bash
git clone https://github.com/NullAITech/azoth-local-agent.git
cd azoth-local-agent
pip install -r requirements.txt

# Launch hardened loopback Web Cockpit on http://127.0.0.1:8136
python3 server.py --host 127.0.0.1 --port 8136

# Single-shot headless execution with JSON output
python3 agent.py -q "Summarize files in sandbox/workspace" --mode regular --json
```

### ZothOS System CLI & Live TUI

```bash
azoth --version                    # v3.1.0
azoth status --json                # Engine & daemon status
azoth modes --json                 # List operating modes
azoth tools --json                 # List all 35 registered Archon tools
azoth -q "Inspect workspace" --mode coder --json
azoth mcp                          # Start JSON-RPC 2.0 MCP stdio server
azoth-local-agent desktop          # Launch Electron desktop cockpit
azoth-local-agent-tui --json       # Live :8136 /health + /api/engines + /api/modes telemetry
```

---

## REST & WebSocket Endpoints (`http://127.0.0.1:8136`)

| Endpoint | Method | Auth | Purpose |
| :--- | :---: | :---: | :--- |
| `/`, `/health`, `/api/health` | `GET`, `HEAD` | Loopback | Dual-theme cockpit UI & daemon health (`v3.1.0`) |
| `/robots.txt`, `/sitemap.xml`, `/og-banner.jpg` | `GET` | Loopback | Crawler directives, sitemap, and `1200×630` JPEG brand banner |
| `/api/engines`, `/api/modes`, `/api/ducky/presets`, `/api/workspace` | `GET` | Loopback | Sanitized engine, mode, preset, and relative workspace listings |
| `/api/chat`, `/api/chat/stream` | `POST` | Loopback | ReAct chat & SSE streaming (accepts optional `engine` and `mode`) |
| `/api/vm/*`, `/api/python/*`, `/api/ducky/run`, `/api/browser/*` | `GET`/`POST` | `X-Azoth-Token` | Token-gated Guest OS, Python REPL, DuckyScript, and Browser control |
| `/api/workspace/file*`, `/api/config/save`, `/api/engine/set`, `/api/mode` | `GET`/`POST` | `X-Azoth-Token` | Token-gated workspace file I/O, allowlisted `.env` config, and state mutations |
| `/ws/terminal?token=<token>` | `WS` | Token + Origin | Authenticated interactive PTY WebSocket bridge |

---

## MCP Client Configuration

```json
{
  "mcpServers": {
    "azoth": {
      "command": "/usr/local/bin/azoth-local-agent",
      "args": ["mcp"]
    }
  }
}
```

---

## Verification & Tests

```bash
./.venv/bin/pytest -q tests/
```

---

## License & Support

- **Open Access**: 100% free and open-access with zero paywalls.
- **Support**: [Buy Us a Coffee via Stripe](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) · Solana Tip Address: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` (`solana:GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`)

Engineered by **Neal Frazier Tech** ([@1nc0gn30](https://github.com/1nc0gn30)) • [NullAI Platform](https://nullai.tech) • [Zoth Studio](https://zoth.nullai.tech/tools/azoth-local-agent)
