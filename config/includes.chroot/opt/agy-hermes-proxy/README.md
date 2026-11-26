# AGY-Hermes OpenAI-Compatible Bridge (`v2.0.0`)

Hardened loopback OpenAI-compatible HTTP gateway bridging **Hermes Agent**, **Zoth Studio**, and local developer tools to the authenticated **Antigravity CLI (`agy`)** runtime on `127.0.0.1:18000`.

---

## What It Does

- Exposes OpenAI-compatible endpoints (`/v1/models`, `/v1/models/{id}`, `/v1/chat/completions`, `/chat/completions`) and Ollama-compatible discovery routes (`/api/tags`, `/api/show`) over loopback `127.0.0.1:18000`.
- Dynamically discovers the full live **27-model** Antigravity catalog (`gemini-4-neon-*`, `gemini-4-carbon-*`, `gemini-4-argon-*`, `gemini-4-hydrogen-*`, `gemini-pro-orchestrator*`, `gemini-3.8-flash-*`, `claude-opus-5-5-*`, `claude-sonnet-5-5-*`, `gpt-oss-120b-medium`) via `agy models` with a 300-second TTL cache and built-in fallback.
- Serves a **zero-egress, dual-theme Operator Cockpit** (Editorial Ivory Light + Obsidian Dark) at `GET /` and an **offline OpenAPI Explorer** at `GET /docs` with zero external CDN or Google Fonts requests.
- Provides a first-class ZothOS CLI (`agy-hermes-proxy serve|status|models|doctor|--version`) and a hardened `systemd --user` service packaged directly into ZothOS ISO chroots.

---

## How It Works

1. Clients send standard OpenAI Chat Completions requests (`stream: false` or `stream: true` SSE) to `http://127.0.0.1:18000/v1/chat/completions`.
2. `LoopbackSecurityMiddleware` validates the `Host` header, `Origin` header, optional `AGY_PROXY_TOKEN` Bearer auth, and `MAX_BODY_BYTES` before JSON parsing.
3. Strict Pydantic models (`ChatCompletionRequest`, `ChatMessage`, `ApiShowRequest`) validate the payload, preserve all roles (`system`, `developer`, `user`, `assistant`, `tool`, `function`), normalize `content: null` to `""`, and verify the requested `model` exists in the active catalog (`404 model_not_found` otherwise).
4. Execution acquires a bounded `asyncio.Semaphore` slot (`429 Too Many Requests` when saturated) and spawns `agy` via `asyncio.create_subprocess_exec(..., shell=False, limit=8 MiB)` with `--input-format stream-json --output-format stream-json --sandbox --model <model> --print-timeout <N>s -p=`.
5. Streaming responses emit an initial `delta: {"role": "assistant"}` chunk, stream `text_delta` frames, honor `stream_options.include_usage`, and terminate with `finish_reason` + `data: [DONE]`. Real token usage is extracted from `agy` result JSON when present.

---

## Security & Subprocess Governance

| Guardrail | Behavior |
| :--- | :--- |
| **DNS Rebinding Protection (`Host`)** | Strict loopback `Host` allowlist (`localhost`, `127.0.0.1`, `[::1]` with optional numeric port). Non-loopback `Host` headers return `403` OpenAI JSON on every route. |
| **Loopback-Only CORS (`Origin`)** | Parses `Origin` with `urllib.parse.urlparse`; verifies `http`/`https`, loopback hostname, exact reconstructed `netloc`, and numeric port. Untrusted or port-suffix spoof origins return `403` JSON on `OPTIONS`/`GET`/`POST`. Always emits `Vary: Origin`, never emits `Access-Control-Allow-Credentials: true`. |
| **Optional Token Auth** | Set `AGY_PROXY_TOKEN=<secret>` to require `Authorization: Bearer <secret>` (`hmac.compare_digest`) on all API routes while keeping `/health` and `/version` probeable. |
| **Body Size Cap** | `AGY_PROXY_MAX_BODY_BYTES` (default `1048576` / `1 MiB`) rejects oversized payloads with `413 Payload Too Large` JSON before JSON parsing. |
| **OpenAI Error Envelopes** | All `400`/`401`/`403`/`404`/`413`/`422`/`429`/`502`/`504` errors return `{"error": {"message", "type", "param", "code"}}` — zero plain-text `500` crashes. |
| **Subprocess Lifecycle** | `try ... finally` guarantees `terminate()` → `1.5s` grace → `kill()` + `wait()` on timeout, error, `CancelledError`, or streaming client disconnect (`orphan_leaked: false`). |
| **Concurrency & Timeout** | `AGY_PROXY_MAX_CONCURRENCY` (default `4`, `429` when saturated) + `AGY_PROXY_TIMEOUT_SECONDS` (default `180`, `504 Gateway Timeout`). |
| **Large Event Lines & Errors** | `8 MiB` stdout stream buffer prevents `LimitOverrunError` on 80 KB+ JSON lines. Non-zero `agy` exits capture sanitized `stderr` and return `502 Bad Gateway` (non-streaming) or an SSE error chunk + `data: [DONE]` (streaming). |
| **Path Hygiene** | `AGY_BIN` resolves dynamically (`AGY_BIN` env → `PATH` → `~/.gemini/antigravity-cli/bin/agy`). `/health` exposes only `agy_available` + `agy_version` (zero raw home-path disclosure). |

---

## OpenAI API & Operator Cockpit

- `GET /` — Zero-egress dual-theme Operator Cockpit (`?theme=light|dark`, live model search, copyable `curl`/Hermes snippets; returns JSON metadata when `Accept: application/json` is preferred).
- `GET /docs` — Offline OpenAPI 3.1 Explorer powered by local `/openapi.json` (zero CDN requests).
- `GET /health` & `HEAD /health` — Health & runtime status (`200 OK`, `HEAD` returns `0 B`).
- `GET /version` — Unified service version (`{"version": "2.0.0"}`).
- `GET /metrics` — Runtime counters (uptime, requests, completions, errors, concurrency, cached models).
- `GET /v1/models`, `/models`, `/api/v1/models`, `/v1/models/{id}` — Live 27-model catalog.
- `POST /v1/chat/completions`, `/chat/completions` — OpenAI Chat Completions (streaming & non-streaming).
- `GET /api/tags`, `POST /api/show` — Ollama-compatible discovery endpoints.

---

## ZothOS CLI & Systemd Commands

```bash
# Version & diagnostics
agy-hermes-proxy --version
agy-hermes-proxy doctor --json

# Query running bridge
agy-hermes-proxy status --port 18000 --json
agy-hermes-proxy models --port 18000

# Run manually on loopback
agy-hermes-proxy serve --host 127.0.0.1 --port 18000

# Legacy compatibility shim (also runs v2.0.0)
python3 ~/.hermes/agy_hermes_proxy.py --port 18000

# Manage hardened systemd --user service
systemctl --user daemon-reload
systemctl --user restart agy-hermes-proxy.service
systemctl --user status agy-hermes-proxy.service --no-pager
```

### Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `AGY_BIN` | Auto-resolved (`PATH` / `~/.gemini/...`) | Override path to `agy` CLI executable |
| `AGY_PROXY_TOKEN` | *(unset / open loopback)* | Enable Bearer token authentication |
| `AGY_PROXY_MAX_BODY_BYTES` | `1048576` (`1 MiB`) | Max request body size before `413` |
| `AGY_PROXY_MAX_CONCURRENCY` | `4` | Max concurrent `agy` subprocesses (`429` above cap) |
| `AGY_PROXY_ACQUIRE_TIMEOUT` | `0.25` | Seconds to wait for a concurrency slot before `429` |
| `AGY_PROXY_TIMEOUT_SECONDS` | `180` | Per-turn execution timeout before `504` |
| `AGY_PROXY_MODEL_CACHE_TTL` | `300` | TTL in seconds for cached `agy models` output |

---

## Port `:18000` Ownership

`127.0.0.1:18000` is canonically owned on ZothOS by **`agy-hermes-proxy.service`** and consumed by Hermes Agent (`~/.hermes/config.yaml`), Zoth Studio (`/api/studio/status`, `/api/studio/composer/providers`, `/tools/agent-composer`, `/workstations/connectors`), Adytum, AEO Graph Engine, Aether Observatory, Zoth Bolt, and Zoth Bot OS.

> **Note for `zoth-gpu-foundry` operators:** Do not bind ad-hoc SSH tunnels for remote Ollama clusters to `127.0.0.1:18000`; use an alternate local port (for example `127.0.0.1:18080` or `127.0.0.1:11435`) to avoid port and `/api/tags` collisions with `agy-hermes-proxy`.

---

## Testing

```bash
PYTHONPATH=src /opt/zothos-ai-env/bin/python3 -m pytest -v tests
```

---

## Support & Attribution

100% free and open-access local developer tool.

- ☕ [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

Engineered by Neal Frazier Tech (@1nc0gn30) • [NullAI Platform](https://nullai.tech) · [GitHub](https://github.com/1nc0gn30/agy-hermes-proxy)
