---
title: "zoth-glow"
tags: [os, cli]
aliases: ["zoth-glow"]
---

# zoth-glow

`file`: Bourne-Again shell script.

`zoth-glow` manages the Zoth Gold Glow overlay—an OS-level desktop visual effect that renders a cursor-following golden aura.

## Usage & Subcommands

```bash
zoth-glow [start|off|toggle|color #HEX|auto]
```

- **`start`** (default): Locates Electron and runs the overlay application from `/opt/zoth-gold-glow` in the background.
- **`off`** / **`stop`**: Halts the running overlay process using its recorded PID file or process match.
- **`toggle`**: Toggles the aura overlay between running and stopped states.
- **`color #HEX`**: Sets the aura accent color (sets `ZOTH_GLOW_COLOR`, default `#ffd700`) for the next start.
- **`auto`**: Writes `/etc/xdg/autostart/zoth-gold-glow.desktop` to automatically start the aura during desktop login.

## Implementation Details

- **Path**: `/usr/local/bin/zoth-glow`
- **Application Directory**: `/opt/zoth-gold-glow`
- **Runtime**: `/usr/bin/env bash` (`set -euo pipefail`)
- **Process Tracking**: Stores the running PID in `/tmp/zoth-glow.pid` and redirects logs to `/tmp/zoth-glow.log`

## See also

[[Zoth OS]] · [[MOC CLIs]]