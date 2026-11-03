---
title: "zoth-ghost"
tags: [os, cli]
aliases: ["zoth-ghost"]
---

# zoth-ghost

`file`: Bourne-Again shell script.

`zoth-ghost` is the ZothOS Ghostmode and AnonSurf CLI engine. It provides automated anti-forensics, memory purging, MAC address randomization, and transparent Tor proxy routing.

## Subcommands & Usage

```bash
zoth-ghost [start|stop|status|ip|change|scrub|netkill|interactive]
```

- **`start`** (`enable`, `on`): Engages the complete Ghostmode protocol:
  - Randomizes MAC addresses across physical network interfaces using `macchanger`
  - Assigns an ephemeral cloaked hostname (`ghost-<hex>`)
  - Routes system traffic through a transparent Tor proxy and disables IPv6 leaks
  - Flushes RAM caches and shreds shell histories (`.bash_history`, `.zsh_history`, `.viminfo`, `.lesshst`)
  - Verifies exit node cloaking via `check.torproject.org`
- **`stop`** (`disable`, `off`): Disengages Tor transparent routing, re-enables IPv6, clears lock state, and restores system hostname to `zothos`.
- **`status`**: Displays active cloak state, current hostname, Tor daemon status, and IP telemetry.
- **`ip`** (`check`, `verify`): Audits public WAN IP, Tor circuit verification, and IPv6/DNS leak status.
- **`change`** (`rotate`, `newip`): Requests a fresh Tor identity circuit (`SIGNAL NEWNYM` via control port 9051) and rotates exit nodes.
- **`scrub`** (`wipe`): Shreds history files, empties thumbnail caches, and syncs/drops OS page caches.
- **`netkill`**: Triggers emergency network blackhole (via `zoth-netkill` or dropping all iptables traffic).
- **`interactive`** (default): Runs an interactive ANSI terminal menu for executing operations.

## Implementation Details

- **Path**: `/usr/local/bin/zoth-ghost`
- **State File**: `/run/zoth_ghostmode.state` (fallback `/tmp/zoth_ghostmode.state`)
- **Desktop Notifications**: Dispatches status alerts via `notify-send` using `/usr/share/pixmaps/zothos.png`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-ghost|zoth-ghost]] · [[Unit zoth-ghost.service|zoth-ghost.service]] · [[CLI zoth-ghost-gui|zoth-ghost-gui]]