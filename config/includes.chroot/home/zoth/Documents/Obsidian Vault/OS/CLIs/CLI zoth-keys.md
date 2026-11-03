---
title: "zoth-keys"
tags: [os, cli]
aliases: ["zoth-keys"]
---

# zoth-keys

`file`: Bourne-Again shell script.

`zoth-keys` opens the ZothOS interactive keybinding reference card in a web browser.

## Functionality & Workflow

1. **Service Verification**: Checks if the local ZothOS desk server is responding at `http://127.0.0.1:8770/`.
2. **On-Demand Daemon Launch**: If unreachable, launches `zoth-os --no-open` in the background (logging to `/tmp/zoth-os.log`) and polls the port until the server is ready.
3. **Browser Display**: Opens `http://127.0.0.1:8770/keys.html` in a new window using `firefox-esr` (or standard `firefox` if ESR is not present).

## Implementation Details

- **Path**: `/usr/local/bin/zoth-keys`
- **Target URL**: `http://127.0.0.1:8770/keys.html`
- **Runtime**: `/usr/bin/env bash` (`set -euo pipefail`)
- **Dependencies**: `curl`, `firefox-esr` / `firefox`, and `zoth-os`

## See also

[[Zoth OS]] · [[MOC CLIs]]