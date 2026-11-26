---
title: "Zoth Chronicle Hub & Engineering Horizon"
tags: [studio, workstation]
aliases: ["chronicle"]
---

# Zoth Chronicle Hub & Engineering Horizon

The **Zoth Chronicle Hub & Engineering Horizon** (`v2.3.0`) is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) under Studio Cockpits & Developer IDEs.

### Core Functionality
Hybrid conversation continuity vault (`:8161` proxy via `/api/studio/chronicle/{summary,recall,search}`), 100% offline browser JSONL/Markdown transcript analyzer, friction pattern radar, and verified Studio release chronicle.

### Workstation Metadata
- **ID:** `chronicle`
- **Name:** Zoth Chronicle Hub & Engineering Horizon
- **Version:** `2.3.0`
- **Execution Mode:** `hybrid` (browser analyzer + optional local `:8161` proxy)
- **Type:** `cockpit` (multi-pane developer IDE and visual operational cockpit for human-agent engineering)
- **Functional Band:** Observe
- **Canonical Route:** `/workstations/chronicle`
- **CLI Entrypoint:** `zoth open chronicle`

### Operational Role
Classified under the Observe band to provide developmental visibility across the platform, connecting live Hermes + AGY continuity threads through Studio's hardened same-origin proxy while enabling offline JSONL/JSON/Markdown session analysis and tracking verified Studio release milestones.

### Incremental Sync Timer (`chronicle-vault-sync.timer`)
Background consolidation runs every 30 minutes (`OnBootSec=5min`, `OnUnitActiveSec=30min`, `Persistent=true`) via `/etc/systemd/user/chronicle-vault-sync.timer` and `chronicle-vault-sync.service` (`MemoryMax=512M`, `CPUQuota=100%`, `TimeoutStartSec=120`, `IOSchedulingClass=idle`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `UMask=0077`, `SyslogIdentifier=chronicle-vault-sync`). It covers Hermes main + all profiles + webchat, AGY transcripts + prompt history, and memory snapshots using `sync_watermarks`, incremental FTS5 updates, `fcntl.flock` lock exclusion, ingest-time secret redaction, and `0600` DB permissions.

```bash
systemctl --user status chronicle-vault-sync.timer chronicle-vault-sync.service
systemctl --user list-timers chronicle-vault-sync.timer
systemctl --user start chronicle-vault-sync.service
journalctl --user -u chronicle-vault-sync.service -n 40 --no-pager
zoth-memory-vault sync-recent --dry-run --json
zoth-memory-vault sync-recent --status --json
```

## See also

[[Zoth Studio]] · [[MOC Workstations]]
