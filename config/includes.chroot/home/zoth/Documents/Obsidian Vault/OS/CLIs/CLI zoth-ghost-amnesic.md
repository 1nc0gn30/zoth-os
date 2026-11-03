---
title: "zoth-ghost-amnesic"
tags: [os, cli]
aliases: ["zoth-ghost-amnesic"]
---

# zoth-ghost-amnesic

`file`: Bourne-Again shell script. Script is an install wrapper in the image.

`zoth-ghost-amnesic` is a privacy, anti-forensics, and stealth routing script located at `/usr/local/bin/zoth-ghost-amnesic`.

### Anonymity & Routing Logic

1. **Tor Provisioning**: Checks if `tor` is available in `PATH` or `/opt/zothos-ai-env/bin/tor`. If missing, attempts to install `tor` and `torsocks` via `apt-get`.
2. **Torified Shell Execution**:
   - If `/opt/zothos-ai-env/bin/tor` exists, launches an interactive bash shell wrapped in `torsocks` with Tor routing notification.
   - If system `tor` is installed, launches `torsocks bash` with outbound traffic routed through the Tor network.
3. **Amnesic RAM Fallback**:
   - If Tor is unavailable, engages a RAM-only stealth session.
   - Unsets `HISTFILE` and redirects `HISTFILE=/dev/null` to disable session history recording.
   - Spawns an amnesic bash shell where command history and session artifacts are not written to disk.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-ghost-amnesic|zoth-ghost-amnesic]] · [[Unit zoth-ghost-amnesic.service|zoth-ghost-amnesic.service]]