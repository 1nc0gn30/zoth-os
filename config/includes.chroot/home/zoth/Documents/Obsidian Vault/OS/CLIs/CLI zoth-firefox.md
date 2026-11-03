---
title: "zoth-firefox"
tags: [os, cli]
aliases: ["zoth-firefox"]
---

# zoth-firefox

`file`: Bourne-Again shell script.

`zoth-firefox` is a browser launcher wrapper located at `/usr/local/bin/zoth-firefox` designed to safely initialize Firefox ESR within ZothOS desktop and virtual machine environments.

### Key Operations

- **Binary Resolution**: Searches for `/usr/bin/firefox-esr`, `/usr/lib/firefox-esr/firefox-esr`, or `/usr/bin/firefox`. If missing, notifies the user via `notify-send` and exits with status 1.
- **Virtual GPU Compatibility**: Sources `/usr/lib/zothos/gfx-compat.sh` and executes `zoth_export_sw_gl_env`. In VMs lacking a hardware GPU render node (VirtualBox, VMware SVGA, virgl), it forces Mesa software GL (`llvmpipe`) so the browser compositor does not crash. Real hardware retains hardware GPU acceleration.
- **Stale Profile Lock Cleanup**: Checks if any Firefox instance for the current user is active. If none is running, it sweeps `~/.mozilla/firefox/*/lock` and `.parentlock` files to prevent the "Firefox is already running" startup blocker caused by abruptly terminated sessions.
- **Execution**: Dispatches directly to the selected Firefox executable with all CLI arguments passed through (`exec "$FF" "$@"`).

## See also

[[Zoth OS]] · [[MOC CLIs]]