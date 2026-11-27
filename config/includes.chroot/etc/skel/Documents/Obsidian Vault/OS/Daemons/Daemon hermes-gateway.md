---
title: "hermes-gateway"
tags: [os, daemon, hermes, systemd]
aliases: ["hermes-gateway", "Hermes Agent Gateway", "hermes-gateway.service"]
unit: "hermes-gateway.service"
port: "ephemeral-loopback (127.0.0.1)"
socket: "~/.hermes/gateway.sock"
subsystem: "Autonomous Agent Gateway"
status: "active"
health_url: "http://127.0.0.1:<discovered-port>/api/health"
repo: "~/NullAITech/hermes-zoth"
optional: false
---

# hermes-gateway

Hermes Agent Gateway — User Systemd Daemon (`hermes-gateway.service`)

- **Systemd Unit:** `hermes-gateway.service` (user unit, `%h`-portable ZothOS chroot template at `/etc/systemd/user/hermes-gateway.service`)
- **HTTP Listener:** Dynamic ephemeral loopback `127.0.0.1:<port>` (discovered dynamically via `hermes-gateway port --json` / `ss -tlnp`; never hardcoded)
- **AF_UNIX Socket:** `~/.hermes/gateway.sock` (`0600`)
- **Multiplexed Profiles (`8`):** `default`, `colibri`, `colibri-64k`, `zoth`, `zoth-auditor`, `zoth-builder`, `zoth-free-scout`, `zoth-growth`
- **Hardening Profile (ZothOS Chroot Template):** `UMask=0077`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `MemoryHigh=3G`, `MemoryMax=4G`, `CPUQuota=400%`, `SyslogIdentifier=hermes-gateway`
- **Studio Telemetry Endpoints (Loopback `:3000`, strictly read-only & path-redacted):**
  - `GET /api/studio/hermes/status`
  - `POST /api/studio/hermes/analyze`
  - Wired into `/api/studio/status`, `/api/studio/connectors`, `/api/studio/fleet`, `/workstations/connectors`, and `/workstations/mission-control`
- **CLI Wrapper:** `/usr/local/bin/hermes-gateway` & `~/.local/bin/hermes-gateway` (4-way parity with `~/NullAITech/hermes-zoth/bin/hermes-gateway`)
- **Opt-In Maintenance Runbook:** `~/NullAITech/zoth-os/docs/HERMES_GATEWAY_MAINTENANCE.md`

## Safe Read-Only Operator Commands

```bash
hermes-gateway status --json
hermes-gateway health --json
hermes-gateway port --json
hermes-gateway list
hermes-gateway doctor
journalctl --user -u hermes-gateway.service -n 50 --no-pager
```

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[Agents/Hermes Agent CLI|Hermes Agent CLI]] · [[OS/Desktops/Desktop hermes-agent|Hermes Agent Desktop]] · [[06-Wiki/Hermes Agent & Multi-Provider MCP Connector Ecosystem]] · [[Zoth Autonomous Agents & Hermes Fleet.canvas]]
