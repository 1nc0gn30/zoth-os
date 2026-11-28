---
title: "konsole-relay"
tags: [os, cli, konsole, dbus, security]
aliases: ["konsole-relay", "CLI konsole-relay"]
---

# konsole-relay

`konsole-relay` (`v2.1.0`) is the portable CLI and loopback daemon launcher for KDE Konsole D-Bus session inspection, screen capture, Antigravity transcript tailing, and audited keystroke relay on `127.0.0.1:8797`.

## Installation & 4-Way Parity

The portable wrapper script resolves `$HOME/konsole-relay/konsole_relay.py` first and falls back to `/opt/konsole-relay/konsole_relay.py`, installed bit-identically at:

1. `~/konsole-relay/konsole-relay`
2. `~/NullAITech/zoth-os/config/includes.chroot/usr/local/bin/konsole-relay`
3. `~/.local/bin/konsole-relay`
4. `/usr/local/bin/konsole-relay`

## Usage & Subcommands

```bash
konsole-relay --help
konsole-relay --version
konsole-relay ls [--json]                      # Enumerate active KDE Konsole sessions via D-Bus
konsole-relay status [--port 8797] [--json]    # Read-only systemd, /health, chmod, & session count
konsole-relay health [--port 8797] [--json]    # Probe http://127.0.0.1:8797/health
konsole-relay read <svc/sid> [-n 60] [--json]  # Capture 1..500 lines (audited)
konsole-relay send <svc/sid> <text> [--no-enter]
konsole-relay agy [-n 20] [--json]             # Tail newest Antigravity log (home paths redacted to ~/)
konsole-relay audit [-n 20] [--json]           # Show recent secret-scrubbed audit.log entries
konsole-relay init-token [--rotate]            # Create or atomically rotate 0600 bearer token
konsole-relay serve [--port 8797]              # Run hardened 127.0.0.1 HTTP relay daemon
```

## Multi-Session Target Disambiguation

When multiple Konsole tabs run the same binary (for example, multiple `~ : agy` sessions), substring matching (`agy`) intentionally errors to prevent misrouted commands. Always obtain the explicit `svc/sid` or `pid/sid` from `konsole-relay ls`:

```bash
konsole-relay ls --json
konsole-relay read org.kde.konsole-2504640/1 -n 40
```

## Security Invariants

- Target resolution enforces `^org\.kde\.konsole-\d+$` and positive `sid >= 1` (rejects arbitrary `org.kde.*` services and leading-dash `qdbus` flags).
- `~/.config/konsole-relay/token` (`0600`) is a local RCE-equivalent credential and MUST NEVER be uploaded to Google Drive or any cloud backup remote.
- Zoth Studio `:3000` integrates strictly read-only telemetry via `GET /api/studio/konsole-relay`, `/api/studio/status`, `/api/studio/fleet`, and `/api/studio/connectors` without ever reading the token or invoking `POST /send`.

## See also

[[Daemon konsole-relay]] · [[CLI zoth-konsole]] · [[Zoth OS]] · [[MOC CLIs]]
