# Hermes Agent Gateway — Opt-In Maintenance Window Runbook

> **Live-Daemon Protection Notice:** Do **not** run destructive steps in this runbook while an active Hermes Agent session or autonomous subagent swarm is executing against `hermes-gateway.service`. All steps below are **opt-in** and intended strictly for a planned maintenance window.

## 1. Pre-Maintenance Read-Only Health Snapshot

Inspect the active daemon without mutating any state or exposing credentials:

```bash
hermes-gateway status --json
hermes-gateway health --json
hermes-gateway port --json
hermes-gateway list
journalctl --user -u hermes-gateway.service -n 50 --no-pager
```

Confirm no active subagent jobs or user sessions are mid-flight before stopping the gateway.

---

## 2. Trim Memory Limit Advisories (`MEMORY.md` & `USER.md`)

When `journalctl --user -u hermes-gateway.service` logs blocked memory-write warnings (`MEMORY.md > 2,200 chars` or `USER.md > 1,375 chars`), back up and condense both files below their upstream character caps:

```bash
cp ~/.hermes/memories/MEMORY.md ~/.hermes/memories/MEMORY.md.bak.$(date +%Y%m%d)
cp ~/.hermes/memories/USER.md ~/.hermes/memories/USER.md.bak.$(date +%Y%m%d)
wc -c ~/.hermes/memories/MEMORY.md ~/.hermes/memories/USER.md
# Condense MEMORY.md to < 2200 chars and USER.md to < 1375 chars
```

---

## 3. Compact `state.db` (`2.2 GiB+` Bloat Remediation)

Large `~/.hermes/state.db` files slow initial hydration of the standalone Hermes Dashboard (`:: Loading...` stall). During your maintenance window:

```bash
systemctl --user stop hermes-gateway.service
cp ~/.hermes/state.db ~/.hermes/state.db.bak.$(date +%Y%m%d)
hermes sessions optimize-storage
ls -lh ~/.hermes/state.db
```

Enable automatic session pruning (`sessions.auto_prune: true`) in `~/.hermes/config.yaml` (without printing or committing secret fields).

---

## 4. Reconcile Stale `whatsapp` Fatal State & Prune Stale Lock Files

If `~/.hermes/gateway_state.json` still records a stale `whatsapp_not_paired` fatal entry from an older run or `~/.local/state/hermes/gateway-locks/host-serve.json` points to a dead PID:

```bash
# Option A: Pair WhatsApp if actively used
hermes gateway setup

# Option B: Clear stale non-active platform record & dead host-serve.json while stopped
rm -f ~/.local/state/hermes/gateway-locks/host-serve.json
```

---

## 5. Apply Hardened `%h`-Portable Systemd Unit (`ZothOS` Chroot Template)

Replace legacy literal-path units with the hardened `%h`-portable ZothOS template (`UMask=0077`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `MemoryHigh=3G`, `MemoryMax=4G`, `CPUQuota=400%`, `SyslogIdentifier=hermes-gateway`):

```bash
systemd-analyze --user verify ~/NullAITech/zoth-os/config/includes.chroot/etc/systemd/user/hermes-gateway.service
cp ~/NullAITech/zoth-os/config/includes.chroot/etc/systemd/user/hermes-gateway.service ~/.config/systemd/user/hermes-gateway.service
systemctl --user daemon-reload
systemctl --user start hermes-gateway.service
hermes-gateway status --json
```

Verify post-start that `hermes-gateway.service` is `active (running)`, `hermes-gateway port --json` discovers the new ephemeral loopback `127.0.0.1:<port>`, and `UMask=0077` restricts newly created state files inside `~/.hermes/`.

---

## 6. Tracked Upstream `NousResearch/hermes-agent` Security & UI Checklist

Keep these items tracked against upstream `hermes-agent` releases (do not fork/patch live `~/.hermes/hermes-agent` mid-session):

1. Redact `hermes_home`, `config_path`, `env_path`, and `gateway_pid` on unauthenticated `GET /api/status`.
2. Gate `/docs` (external CDN Swagger UI) and `/openapi.json` behind loopback auth and deduplicate `relay_http` FastAPI operation IDs (`webapp_relay_proxy.py`).
3. Emit global HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP) on the loopback dashboard listener.
4. Publish the active ephemeral loopback port inside `~/.local/state/hermes/gateway-locks/host-gateway.json`.
5. Support light-mode polarity, WCAG AA contrast on sidebar footer links, and confirmation guards on `Restart Gateway` in the standalone dashboard UI.
6. Upgrade root and `web` workspace npm dependencies to clear the 2 moderate advisories reported by `hermes doctor`.

---

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform · [hermes-zoth](https://github.com/1nc0gn30/hermes-zoth) · [nullai.tech](https://nullai.tech)
