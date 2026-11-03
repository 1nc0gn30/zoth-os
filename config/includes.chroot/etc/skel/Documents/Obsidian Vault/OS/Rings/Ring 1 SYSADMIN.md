---
title: "Ring 1: System Admin & Privileged Operations"
tags: [os, ring]
aliases: ["SYSADMIN", "ring-1"]
---

# Ring 1: System Admin & Privileged Operations

Privileged administration: manage user-space daemons, configure networking, query package databases, run security auditing, and orchestrate agent workers.

- **Codename:** `SYSADMIN`
- **Active on this image:** ring `2` (this note is ring 1)
- **Confirmation required above ring:** `1`
- **Default engine:** `ollama`
- **Network:** `proxied_and_lan` · ports 22, 53, 80, 443, 8000, 8080, 8188, 8199, 8888, 8989, 9050, 11434
- **Tor enforced:** `False`
- **Sandbox:** `cgroups_standard` · CPU 90% · RAM 16384 MB
- **Tokens / request:** 64000 · hourly 1000000 · timeout 300s
- **FS read:** ~, /etc, /var/log, /usr/share/zothos, /opt, /tmp, /proc, /sys
- **FS write:** ~, /var/lib/zothos, /tmp, /etc/zothos

**Allowed.** `read_file`, `write_file`, `delete_file`, `run_shell`, `system_status`, `inspect_process`, `list_directory`, `search_filesystem`, `network_info`, `view_logs`, `git_operations`, `package_query`, `systemd_query`, `run_sec_tool`, `toggle_ghostmode`, `mac_randomize` …

**Denied.** `run_root_command`, `disk_format`, `kernel_module_load`, `panic_kill`, `amnesic_purge`

From `etc/zothos/agent-permissions.json` v3.0.0. MCP catalog stays off regardless of ring.

## See also

[[Agent permissions]] · [[Zoth OS]] · [[MCP Catalog]]
