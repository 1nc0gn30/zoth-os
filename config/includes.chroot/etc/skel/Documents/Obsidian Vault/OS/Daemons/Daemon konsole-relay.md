---
title: "konsole-relay"
tags: [os, daemon, konsole, dbus, security, systemd]
aliases: ["konsole-relay", "konsole-relay.service", "Konsole Relay"]
unit: "konsole-relay.service"
port: "8797 (127.0.0.1 Loopback)"
subsystem: "KDE Konsole D-Bus Relay"
status: "active"
health_url: "http://127.0.0.1:8797/health"
repo: "~/konsole-relay"
optional: false
---

# konsole-relay

Konsole Relay (`v2.1.0`) — Hardened Loopback KDE Konsole D-Bus Relay Daemon (`konsole-relay.service`)

- **Systemd Unit:** `konsole-relay.service` (user unit; ZothOS chroot template at `/etc/systemd/user/konsole-relay.service`, source copy at `~/konsole-relay/konsole-relay.service`)
- **HTTP Listener:** `127.0.0.1:8797` strictly loopback-only (`RelayHTTPServer`, `daemon_threads=True`, `request_queue_size=32`, `10s` socket timeout)
- **D-Bus Boundary:** Invokes Qt6 `qdbus`/`qdbus6` without `shell=True`, strictly validating every target against `^org\.kde\.konsole-\d+$` and positive session integer `sid >= 1` inside `resolve()`, `read_text()`, and `send()`
- **Authentication & Transport Guards:**
  - Fail-closed bearer token at `~/.config/konsole-relay/token` (`0600`, minimum `32` non-whitespace chars, constant-time `hmac.compare_digest`; empty/short tokens fail closed with `503`/`RuntimeError`)
  - Strict loopback `Host` allowlist (DNS-rebinding defense -> JSON `400`)
  - Cross-origin `Origin` and non-`none` `Sec-Fetch-Site` rejection -> JSON `403`, zero `Access-Control-Allow-Origin` headers
  - Strict `Content-Length` bounds (`0 <= n <= 65536`; `< 0` -> `400`, `> 65536` -> `413`), per-IP `401` rate limiting (`10 / 60s` -> `429` + `Retry-After`), per-session `threading.Lock` on `send()`
  - Security headers (`nosniff`, `DENY`, `no-referrer`, `CSP default-src 'none'`, `no-store`, `Server: konsole-relay`) on all `GET`, `POST`, `HEAD`, `OPTIONS`, and error responses
- **Audit Trail:** `~/.config/konsole-relay/audit.log` (`0600`, `0700` parent dir) records `send`, `read`, `agy`, `auth_fail`, and `auth_rate_limited` events with inline secret scrubbing, `~/` path redaction, and `1 MiB` rollover (`audit.log.1`)
- **Hardening Profile (ZothOS Chroot Template):** `ConditionPathExists=/opt/konsole-relay/konsole_relay.py`, `UMask=0077`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `MemoryHigh=64M`, `MemoryMax=128M`, `CPUQuota=50%`, `SyslogIdentifier=konsole-relay`, `RestartSec=3`
- **Studio Telemetry Integration (Loopback `:3000`, strictly read-only & path-redacted):**
  - `GET` / `HEAD /api/studio/konsole-relay`
  - `GET /api/studio/status` (`services.konsoleRelay`)
  - `GET /api/studio/fleet` (`konsole-relay`, port `8797`)
  - `GET /api/studio/connectors` (`bridges` entry `konsole-relay`, port `8797`)
- **CLI Wrapper:** `/usr/local/bin/konsole-relay` & `~/.local/bin/konsole-relay` (4-way bit-identical parity with `~/konsole-relay/konsole-relay` and ZothOS chroot)

## RCE Threat Model & Cloud Backup Exclusion

Because `POST /send` injects keystrokes into live KDE Konsole shells, `~/.config/konsole-relay/token` is a local RCE-equivalent bearer credential and `~/.config/konsole-relay/audit.log` records terminal command snippets.

- **NEVER** sync or copy `~/.config/konsole-relay` to Google Drive, S3, Git, or any external remote.
- `/usr/local/bin/zoth-gdrive-backup` explicitly excludes `~/.config/konsole-relay` (enforced by automated tests in `zoth-os/tests/test_zoth_os_hygiene.py`).

## Safe Read-Only Operator Commands

```bash
konsole-relay status --json
konsole-relay health --json
konsole-relay ls --json
konsole-relay audit -n 20 --json
journalctl --user -u konsole-relay.service -n 50 --no-pager
```

## Opt-In Maintenance Window Cutover, Token Rotation & Cloud Purge

Execute ONLY during a planned maintenance window when no automation is actively sending commands via `:8797`:

```bash
cp ~/konsole-relay/konsole-relay.service ~/.config/systemd/user/konsole-relay.service
systemctl --user daemon-reload
systemd-analyze --user verify ~/.config/systemd/user/konsole-relay.service
konsole-relay init-token --rotate
systemctl --user restart konsole-relay.service
konsole-relay status --json
rclone purge "gdrive20tb:Zoth-Workstation-Backup-2026-11/home/.config/konsole-relay"
```

## See also

[[CLI konsole-relay]] · [[CLI zoth-konsole]] · [[Daemon hermes-gateway]] · [[Daemon hermes-webchat]] · [[Zoth OS]] · [[MOC Daemons]]
