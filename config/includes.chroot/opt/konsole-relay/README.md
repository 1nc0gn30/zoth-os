# konsole-relay (`v2.1.0`)

Loopback KDE Konsole D-Bus Relay Daemon & CLI (`127.0.0.1:8797`). Pure Python 3 standard library — zero external dependencies.

Communicates with open KDE Konsole sessions over the user D-Bus session bus (`qdbus`/`qdbus6`) to list active sessions, capture displayed screen text, tail recent Antigravity transcripts, and inject audited keystrokes when authorized by a local `0600` bearer token.

---

## Architecture & Security Model

- **D-Bus Transport (`qdbus`/`qdbus6`)**: Calls `org.kde.konsole.Session.{title,processId,foregroundProcessId,getAllDisplayedText,getDisplayedText,sendText}` without `shell=True`. Every target is strictly validated against `^org\.kde\.konsole-\d+$` and integer `sid >= 1` inside `resolve()`, `read_text()`, and `send()` — preventing cross-service D-Bus calls (e.g. `org.kde.plasmashell/1`) or CLI flag injection (`--system`).
- **Loopback-Only HTTP Listener (`127.0.0.1:8797`)**:
  - **Fail-Closed Bearer Auth**: `load_token()` enforces `0700` on `~/.config/konsole-relay`, `0600` on `~/.config/konsole-relay/token`, and a minimum 32-character non-whitespace secret. Empty or truncated tokens fail closed (`RuntimeError` on boot / `503` on request) and never match via `hmac.compare_digest`.
  - **DNS-Rebinding & Cross-Origin Defenses**: Validates `Host` against exact loopback values (`127.0.0.1:<port>`, `localhost:<port>`, `[::1]:<port>`), returning JSON `400` on hostile hosts. Rejects any `Origin` header or non-`none` `Sec-Fetch-Site` header with JSON `403`, and emits zero `Access-Control-Allow-Origin` headers.
  - **DoS & Brute-Force Protection**: Enforces `0 <= Content-Length <= 65536` (`400` on negative/non-integer, `413` on oversized), `10s` socket timeout, `daemon_threads = True`, `request_queue_size = 32`, per-IP `401` rate limiting (`10` failures / `60s` -> `429` + `Retry-After`), and per-session `threading.Lock` serialization around `send()`.
  - **HTTP Response Hygiene**: Emits `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Cache-Control: no-store`, and `Server: konsole-relay` (Python version banner suppressed) on every response (`GET`, `POST`, `HEAD`, `OPTIONS`, and errors).
- **Secret-Scrubbed Audit Log (`~/.config/konsole-relay/audit.log`, `0600`)**: Records `send`, `read`, `agy`, `auth_fail`, and `auth_rate_limited` events with inline secret scrubbing (`Bearer`, `sk-`, `ghp_`, `password=`, `token=`), `~/` path redaction, and automatic `1 MiB` rollover to `audit.log.1`.

### Threat Model Warning — Never Cloud-Sync `~/.config/konsole-relay`

`POST /send` injects keystrokes directly into live desktop shells, making `~/.config/konsole-relay/token` a **local RCE-equivalent credential** and `~/.config/konsole-relay/audit.log` a sensitive terminal history trail.

- **NEVER** copy, sync, or back up `~/.config/konsole-relay` to Google Drive, S3, Git, or any shared remote.
- ZothOS `zoth-gdrive-backup` explicitly excludes `~/.config/konsole-relay` (enforced by automated regression tests in `zoth-os/tests/test_zoth_os_hygiene.py`).

---

## Multi-Session Targeting & CLI Reference

Install path: `/usr/local/bin/konsole-relay` (and `~/.local/bin/konsole-relay`), resolving `~/konsole-relay/konsole_relay.py` or `/opt/konsole-relay/konsole_relay.py`.

When multiple tabs share a title (for example, 5 concurrent `~ : agy` sessions), substring matching (`agy`) intentionally errors so commands never land in the wrong shell. Always target explicitly by **`svc/sid`** or **`pid/sid`** obtained from `konsole-relay ls`:

```bash
# Enumerate live KDE Konsole sessions (table or JSON)
konsole-relay ls
konsole-relay ls --json

# Check daemon systemd state, /health, file modes, and session count (read-only)
konsole-relay status
konsole-relay status --json
konsole-relay health --json

# Read last 40 lines from an explicit Konsole session (safe on multi-agent desktops)
konsole-relay read org.kde.konsole-2504640/1 -n 40
konsole-relay read 2504640/1 -n 40 --json

# Send text (appends Enter \r by default; pass --no-enter to omit Enter)
konsole-relay send 2504640/1 "git status"
konsole-relay send 2504640/1 "partial-input" --no-enter

# Tail newest Antigravity conversation file (home paths redacted to ~/)
konsole-relay agy -n 20 --json

# Inspect recent audit log entries (secret-scrubbed)
konsole-relay audit -n 20 --json

# Initialize or atomically rotate the 0600 bearer token (never printed)
konsole-relay init-token
konsole-relay init-token --rotate

# Run loopback HTTP daemon on 127.0.0.1:8797
konsole-relay serve --port 8797
```

---

## HTTP API (`http://127.0.0.1:8797`)

All routes except `GET`/`HEAD /health` require `Authorization: Bearer <token>` from `~/.config/konsole-relay/token`.

| Method | Path | Auth | Behavior |
| :--- | :--- | :---: | :--- |
| `GET` / `HEAD` | `/health` | No | Loopback liveness probe (`{"ok": true}`) |
| `GET` | `/sessions` | Bearer | JSON list of open KDE Konsole sessions |
| `GET` | `/read?target=<svc/sid>&lines=60` | Bearer | Read `1..500` lines from validated Konsole session (audited) |
| `GET` | `/agy?lines=20` | Bearer | Best-effort tail of newest Antigravity log with `~/` path redaction (audited) |
| `POST` | `/send` | Bearer | JSON `{"target":"pid/sid","text":"...","enter":true}` (<= 64 KiB, per-session locked, audited) |
| `OPTIONS` | `*` | No | JSON `405 Method Not Allowed` (`Allow: GET, POST, HEAD`, zero CORS headers) |

### Zoth Studio `:3000` Read-Only Telemetry

Zoth Studio surfaces read-only daemon status, security posture, and `stat`-only file-mode checks (never reading the token and never calling `/send`):

- `GET /api/studio/konsole-relay` (and `HEAD`)
- `GET /api/studio/status` (`services.konsoleRelay`)
- `GET /api/studio/fleet` (port `8797`)
- `GET /api/studio/connectors` (`bridges` entry `konsole-relay`)

---

## Opt-In Maintenance Window Cutover, Token Rotation & Cloud Purge Runbook

Perform these steps ONLY during a planned maintenance window when no automation is actively sending commands through `:8797`:

```bash
# 1. Install the hardened %h-portable systemd user unit
cp ~/konsole-relay/konsole-relay.service ~/.config/systemd/user/konsole-relay.service
systemctl --user daemon-reload
systemd-analyze --user verify ~/.config/systemd/user/konsole-relay.service

# 2. Rotate the bearer token (recommended if ~/.config/konsole-relay was ever backed up)
konsole-relay init-token --rotate

# 3. Restart the user service cleanly and verify
systemctl --user restart konsole-relay.service
konsole-relay status --json
journalctl --user -u konsole-relay.service -n 20 --no-pager

# 4. Purge any historical cloud backup copy of the old token/audit log
rclone purge "gdrive20tb:Zoth-Workstation-Backup-2026-11/home/.config/konsole-relay"
```

---

## Running Tests

```bash
python3 -W error::ResourceWarning -m unittest discover -s tests -v
```

---

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform  
Website: https://nullai.tech • Source: https://github.com/1nc0gn30/konsole-relay  
100% Free & Open Access — Support development: [☕ Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`
