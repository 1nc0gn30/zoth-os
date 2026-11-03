---
title: "zoth-heal"
tags: [os, cli]
aliases: ["zoth-heal"]
---

# zoth-heal

`file`: Bourne-Again shell script.

`zoth-heal` is the ZothOS Autonomous Self-Healing and Resilience Subsystem (v3.0). It provides automated diagnostics and proactive repairs across core OS components, daemons, and configuration files.

## Subsystem Domains

- **Packages (`--packages`)**: Cleans stale APT locks, resolves broken dependencies, refreshes expired GPG repository keys, and configures mirror fallbacks.
- **Display (`--display`)**: Inspects and restores window managers, compositors, panel services, and graphical sessions.
- **Network (`--network`)**: Restores NetworkManager connections, flushes DNS caches, validates `resolv.conf`, and resets network interfaces or Tor routing.
- **Disk (`--disk`)**: Relieves storage pressure by pruning APT package caches, vacuuming systemd journal logs, and purging temporary files.
- **Desktop (`--desktop`)**: Validates user configuration directories (`~/.config`) and restores corrupted desktop settings from `/etc/skel` templates.
- **Audio (`--audio`)**: Restarts unresponsive audio daemons including PipeWire, WirePlumber, and PulseAudio.
- **Python / MCP (`--python`)**: Checks Python virtual environments and restores MCP server configurations and permission registries.

## Usage & Flags

```bash
zoth-heal [OPTIONS]
```

- `--all`: Runs full diagnostic and remediation routines across every subsystem (default action).
- `--quick`: Executes a rapid, non-blocking check with lightweight critical repairs.
- `--quiet`, `-q`: Suppresses terminal output, intended for background cron jobs and systemd timers.
- `--json`: Formats diagnostic evaluations and remediation logs into structured JSON output.

## Implementation Details

- **Path**: `/usr/local/bin/zoth-heal`
- **Interpreter**: `/usr/bin/env bash` (`set -uo pipefail`)
- **Integration**: Supports scheduled automated self-healing and interactive recovery operations

## See also

[[Zoth OS]] · [[MOC CLIs]]