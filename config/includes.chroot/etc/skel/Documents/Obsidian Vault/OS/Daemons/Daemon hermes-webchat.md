---
title: "hermes-webchat"
tags: [os, daemon, hermes, webchat, tailscale, systemd]
aliases: ["hermes-webchat", "Zoth Console", "zoth-webchat.service"]
unit: "zoth-webchat.service"
port: "8178 (Tailscale 100.x)"
subsystem: "Tailnet Agent Console"
status: "active"
health_url: "http://<tailnet-ip>:8178/api/health"
repo: "~/NullAITech/hermes-webchat"
optional: false
---

# hermes-webchat

Hermes WebChat (`Zoth Console` v2.1.0) — Tailnet-Only User Systemd Daemon (`zoth-webchat.service`)

- **Systemd Unit:** `zoth-webchat.service` (user unit, `%h`-portable ZothOS chroot template at `/etc/systemd/user/zoth-webchat.service`)
- **HTTP Listener:** Port `8178` bound strictly to the private Tailscale IPv4 address (`100.x:8178`, fallback `127.0.0.1:8178`; never `0.0.0.0`)
- **Authentication:** Fail-closed bearer token at `~/.config/zoth-webchat/token` (`0600`), verified via `hmac.compare_digest` and stored in an `HttpOnly; SameSite=Strict` cookie (`zc_token`). Query-string `/?token=` login is disabled (`400`); token file changes hot-reload automatically by `mtime`.
- **Hardening Profile (ZothOS Chroot Template):** `UMask=0077`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `MemoryHigh=256M`, `MemoryMax=512M`, `CPUQuota=100%`, `SyslogIdentifier=zoth-webchat`, `WorkingDirectory=/opt/hermes-webchat`
- **Studio Telemetry Integration (Loopback `:3000`, strictly read-only & path-redacted):**
  - `GET /api/studio/hermes/status` (`webchat` field)
  - `GET /api/studio/status` (`services.hermesWebchat`)
  - `GET /api/studio/connectors` (`bridges` entry `hermes-webchat`, port `8178`)
  - `GET /api/studio/fleet` (`hermes-webchat`, port `8178`)
- **CLI Wrapper:** `/usr/local/bin/hermes-webchat` & `~/.local/bin/hermes-webchat` (4-way parity with `~/NullAITech/hermes-webchat/bin/hermes-webchat` and ZothOS chroot)

## Safe Read-Only Operator Commands

```bash
hermes-webchat status --json
hermes-webchat health --json
hermes-webchat url
hermes-webchat token-init        # creates 0700 dir + 0600 token (never overwrites without --force)
journalctl --user -u zoth-webchat.service -n 50 --no-pager
```

## Opt-In Host Maintenance Window Steps

Apply permission tightening and the `%h`-portable hardened unit during a planned maintenance window (never interrupt active user chat sessions unannounced):

```bash
chmod 0700 ~/.config/zoth-webchat ~/.hermes/webchat
chmod 0600 ~/.config/zoth-webchat/token ~/.hermes/webchat/history.jsonl
cp ~/NullAITech/zoth-os/config/includes.chroot/etc/systemd/user/zoth-webchat.service \
   ~/.config/systemd/user/zoth-webchat.service
systemctl --user daemon-reload
systemctl --user restart zoth-webchat.service
hermes-webchat status --json
```

## See also

[[Daemon hermes-gateway]] · [[Zoth OS]] · [[MOC Daemons]] · [[Agents/Hermes Agent CLI|Hermes Agent CLI]] · [[06-Wiki/Hermes Agent & Multi-Provider MCP Connector Ecosystem]]
