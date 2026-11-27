# Hermes WebChat (`Zoth Console` v2.1.0)

Private tailnet-only web console for invoking the local Hermes Agent CLI (`hermes --continue <session> -z "<prompt>"`) with fail-closed bearer authentication, real-time Server-Sent Events (SSE) streaming, and dual Light / Dark themes.

## What It Does
- **Pinned Session Execution**: Runs every prompt against an explicit, persisted Hermes session (`zoth-webchat` by default) so interactive terminal sessions are never hijacked.
- **Live SSE Streaming**: Streams `hermes` subprocess stdout directly to the browser over `/api/stream?job=<id>` with 20-second keepalives, bounded `2 MiB` / `4096`-chunk buffers, and process-group termination (`os.killpg`) on Stop or timeout.
- **Dual-Theme Workstation**: Supports both Editorial Ivory Light Mode (`#FAF8F3` paper / `#181612` ink) and Obsidian Dark Mode (`#06070a` / `#e8edf4`), honoring `?theme=light|dark`, `prefers-color-scheme`, and a persistent Light/Dark toggle.
- **Client-Side Exports & Offline Clarity**: Includes sanitized Markdown and JSON transcript export, an HTTP clipboard fallback for non-HTTPS tailnet URLs, and a visible offline/fail-closed banner with Retry when the daemon is unreachable.

## How It Works
- `server.py` — Stdlib-only `ThreadingHTTPServer` (`request_queue_size = 32`) listening on the Tailscale IPv4 address (`100.x:8178`) or explicit `WEBCHAT_HOST` / `WEBCHAT_BIND`. Uses `os.path.expanduser("~")` (zero hardcoded user paths), hot-reloads the bearer token file on `mtime` change, persists the active session in `state.json` (`0600`), and caches `history.jsonl` message counts by `(st_mtime_ns, st_size)` for `O(1)` status polling.
- `index.html`, `app.js`, `app.css`, `favicon.svg` — Zero-dependency single-page console with strict `HttpOnly; SameSite=Strict` cookie authentication (no `localStorage` token mirroring), tokenized Markdown rendering (no nested links inside code spans), `>= 44 px` mobile tap targets, and full ARIA landmarks.
- `bin/hermes-webchat` — Portable read-only-safe CLI wrapper (`--help`, `status --json`, `health --json`, `url`, `token-init`) installed identically across `/usr/local/bin/hermes-webchat`, `~/.local/bin/hermes-webchat`, and ZothOS chroot.

## Threat Model & Private `robots.txt` Rationale
- **Network Boundary**: Binds strictly to the private WireGuard-encrypted Tailscale IPv4 address (`100.x`) or `127.0.0.1` — never `0.0.0.0`.
- **Fail-Closed Authentication**: If `~/.config/zoth-webchat/token` is missing, unreadable, or empty, all `/api/*` endpoints (except `/api/health`) fail closed with `503 {"error":"token not configured"}`. Query-string `/?token=` login is rejected (`400`) so tokens never enter browser history or `Referer` logs.
- **DNS-Rebinding & CSRF Defenses**: Every request validates `Host` against an explicit allowlist (`<bind>:<port>`, `127.0.0.1:<port>`, `localhost:<port>`, `[::1]:<port>` -> `400` on untrusted hosts). All `POST` routes enforce `Origin` and `Sec-Fetch-Site` checks (`403` on cross-origin), strict `64 KiB` body cap (`413`), and malformed/negative `Content-Length` rejection (`400`).
- **Response Hardening**: Emits `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, strict `Content-Security-Policy` (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`), `Cache-Control: no-store`, and suppresses Python version strings (`Server: ZothConsole/2.1`).
- **Rate Limiting & Injection Guards**: `/api/login` enforces a per-IP sliding window (`5` failures / `60s` -> `429`). Session names must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (blocking leading `-` CLI flag injection).
- **Private `robots.txt` Rationale**: Unlike public web apps, `hermes-webchat` is a private tailnet operator console, so `robots.txt` intentionally serves `Disallow: /` and `index.html` declares `<meta name="robots" content="noindex, nofollow">` to prevent crawler indexation on private networks.

## Configuration (Environment Variables)
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `WEBCHAT_HOST` / `WEBCHAT_BIND` | Tailscale IPv4 / `127.0.0.1` | Bind address |
| `WEBCHAT_PORT` | `8178` | HTTP listen port |
| `WEBCHAT_SESSION` | `zoth-webchat` | Initial pinned Hermes session name |
| `WEBCHAT_TOKEN_FILE` | `~/.config/zoth-webchat/token` | Bearer token file (`0600`) |
| `WEBCHAT_HISTORY_DIR` | `~/.hermes/webchat` | Directory for `history.jsonl` & `state.json` (`0700`) |
| `WEBCHAT_STATE_FILE` | `<WEBCHAT_HISTORY_DIR>/state.json` | Persisted active session file (`0600`) |
| `WEBCHAT_HERMES_BIN` | `~/.hermes/hermes-agent/.hermes/bin/hermes` | Hermes CLI binary path |
| `WEBCHAT_TIMEOUT` | `900` | Per-turn subprocess timeout (seconds) |

## HTTP & SSE API Reference
| Method & Path | Auth | Behavior |
| :--- | :---: | :--- |
| `GET`/`HEAD /health`, `/api/health` | Public | Minimal liveness JSON (`ok`, `service`, `version`, `auth_required`, `token_configured`) — zero path/PID/secret leakage |
| `OPTIONS *` | Public | `204 No Content` for same-origin / no-origin; `403` for cross-origin |
| `POST /api/login` | Public | Verifies bearer token (`hmac.compare_digest`), sets `zc_token` `HttpOnly; SameSite=Strict` cookie; `429` after 5 failures / 60s |
| `POST /api/logout` | Public | Clears `zc_token` cookie (`Max-Age=0`) |
| `GET /api/status` | Cookie / Header | Returns host, endpoint, active session, busy state, `O(1)` cached message counts, and uptime |
| `GET /api/history` | Cookie / Header | Returns up to last `400` messages from `history.jsonl` |
| `GET /api/stream?job=<id>` | Cookie / Header | SSE stream (`event: chunk`, `event: done`, `: keepalive` every 20s) |
| `POST /api/send` | Cookie / Header | Launches `hermes --continue <session> -z <text>` under `_state_lock`; `409` if busy |
| `POST /api/stop` | Cookie / Header | Terminates active turn process group via `os.killpg(..., SIGKILL)` |
| `POST /api/history/clear` | Cookie / Header | Truncates `history.jsonl`, clamping `keep` to `[0, 100000]` |
| `POST /api/session/new` | Cookie / Header | Validates & persists new pinned session name (`^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`) |

## ZothOS CLI (`hermes-webchat`)
```bash
hermes-webchat --help          # Usage overview
hermes-webchat status --json   # Read-only systemd + listener + permission telemetry (0 /home/ leaks)
hermes-webchat health --json   # Probes live /api/health or reports daemon state
hermes-webchat url             # Prints active tailnet/loopback URL
hermes-webchat token-init      # Creates 0700 dir & 0600 32-byte token (never overwrites without --force)
```

## Systemd Deployment & Token Rotation (`0600`)
ZothOS ships a `%h`-portable hardened user unit at `/etc/systemd/user/zoth-webchat.service` (`UMask=0077`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `MemoryHigh=256M`, `MemoryMax=512M`, `CPUQuota=100%`, `SyslogIdentifier=zoth-webchat`).

To rotate the bearer token without restarting `zoth-webchat.service` (`server.py` v2.1.0 hot-reloads on `mtime` change):
```bash
hermes-webchat token-init --force
```

## Opt-In Host Maintenance Window Steps
When upgrading an already-running host daemon during a planned maintenance window:
```bash
# 1. Tighten runtime directory & history permissions
chmod 0700 ~/.config/zoth-webchat ~/.hermes/webchat
chmod 0600 ~/.config/zoth-webchat/token ~/.hermes/webchat/history.jsonl

# 2. Install the hardened %h-portable user systemd unit
cp ~/NullAITech/zoth-os/config/includes.chroot/etc/systemd/user/zoth-webchat.service \
   ~/.config/systemd/user/zoth-webchat.service
systemctl --user daemon-reload
systemctl --user restart zoth-webchat.service

# 3. Verify read-only status
hermes-webchat status --json
```

## Troubleshooting (`100.x` vs `127.0.0.1`)
Because `zoth-webchat.service` binds strictly to the Tailscale IPv4 address (`100.x:8178`) when Tailscale is up, `http://127.0.0.1:8178/` will return connection refused unless `WEBCHAT_HOST=127.0.0.1` is explicitly configured. Use `hermes-webchat url` to print the active listener address.

---

Engineered by Neal Frazier Tech ([@1nc0gn30](https://github.com/1nc0gn30)) • [NullAI Platform](https://nullai.tech)  
☕ [Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`
