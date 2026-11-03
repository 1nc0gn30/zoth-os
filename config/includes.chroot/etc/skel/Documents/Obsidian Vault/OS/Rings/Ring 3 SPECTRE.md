---
title: "Ring 3: Sandboxed LLM Execution & Untrusted Code"
tags: [os, ring]
aliases: ["SPECTRE", "ring-3"]
---

# Ring 3: Sandboxed LLM Execution & Untrusted Code

Sandboxed / Restricted Execution: ephemeral isolated container/firejail environment for executing untrusted models and generated code, read-only telemetry, and loopback-only network access.

- **Codename:** `SPECTRE`
- **Active on this image:** ring `2` (this note is ring 3)
- **Confirmation required above ring:** `1`
- **Default engine:** `ollama`
- **Network:** `isolated_loopback_only` · ports 11434, 8000
- **Tor enforced:** `False`
- **Sandbox:** `firejail_strict` · CPU 50% · RAM 2048 MB
- **Tokens / request:** 8000 · hourly 50000 · timeout 45s
- **FS read:** /tmp/zothos-sandbox, ~/sandbox, /proc/stat, /proc/meminfo
- **FS write:** /tmp/zothos-sandbox

**Allowed.** `read_file`, `system_status`, `inspect_process`, `list_directory`, `search_filesystem`, `network_info`, `view_logs`, `run_sandboxed_code`

**Denied.** `write_file`, `delete_file`, `run_shell`, `gui_click`, `gui_type`, `gui_press_key`, `gui_screenshot`, `gui_drag_window`, `gui_open_app`, `browser_automate`, `run_sec_tool`, `toggle_ghostmode` …

From `etc/zothos/agent-permissions.json` v3.0.0. MCP catalog stays off regardless of ring.

## See also

[[Agent permissions]] · [[Zoth OS]] · [[MCP Catalog]]
