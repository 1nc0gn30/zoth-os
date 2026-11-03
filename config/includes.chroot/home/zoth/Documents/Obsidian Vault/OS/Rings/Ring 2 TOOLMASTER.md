---
title: "Ring 2: Agent Tools & MCP Runtime"
tags: [os, ring]
aliases: ["TOOLMASTER", "ring-2"]
---

# Ring 2: Agent Tools & MCP Runtime

Standard agent operations: full Model Context Protocol (MCP) server integration, host file operations within user workspace, desktop GUI automation, Puppeteer browser control, SQLite/DuckDB queries, and HexStrike pentesting tools.

- **Codename:** `TOOLMASTER`
- **Active on this image:** ring `2` (this note is ring 2)
- **Confirmation required above ring:** `1`
- **Default engine:** `ollama`
- **Network:** `standard_egress` · ports 53, 80, 443, 8000, 8080, 8188, 8199, 8888, 8989, 11434
- **Tor enforced:** `False`
- **Sandbox:** `user_namespace` · CPU 80% · RAM 8192 MB
- **Tokens / request:** 32000 · hourly 250000 · timeout 180s
- **FS read:** /home/zoth, /usr/share/zothos, /opt, /etc/zothos, /var/lib/zothos, /tmp
- **FS write:** /home/zoth, /var/lib/zothos, /tmp

**Allowed.** `read_file`, `write_file`, `delete_file`, `run_shell`, `system_status`, `inspect_process`, `list_directory`, `search_filesystem`, `network_info`, `view_logs`, `git_operations`, `package_query`, `gui_click`, `gui_type`, `gui_press_key`, `gui_screenshot` …

**Denied.** `run_root_command`, `systemd_manage`, `toggle_ghostmode`, `mac_randomize`, `tor_routing_control`, `disk_format`, `panic_kill`, `amnesic_purge`

From `etc/zothos/agent-permissions.json` v3.0.0. MCP catalog stays off regardless of ring.

## See also

[[Agent permissions]] · [[Zoth OS]] · [[MCP Catalog]]
