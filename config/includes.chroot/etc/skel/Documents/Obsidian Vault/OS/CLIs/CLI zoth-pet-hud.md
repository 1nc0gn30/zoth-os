---
title: "zoth-pet-hud"
tags: [os, cli]
aliases: ["zoth-pet-hud"]
---

# zoth-pet-hud

`file`: Bourne-Again shell script.

`zoth-pet-hud` is a launcher script for the All-Seeing Eye companion overlay HUD in ZothOS. Located at `/usr/local/bin/zoth-pet-hud`.

## Paths & Directory Setup
- Target directory: `/opt/zoth-hud`
- Launch script: `/opt/zoth-hud/launch.sh`
- Companion directory: `/opt/zoth-desktop-pet`

If `/opt/zoth-hud` does not exist, the script attempts to create the directory and initialize a basic package structure via `npm init -y` if npm is present.

## Launch Priority
The script checks for runnable components in sequential order:
1. **Executable Launch Script**: If `/opt/zoth-hud/launch.sh` exists and is executable, it runs `exec "$HUD_LAUNCH" "$@"`.
2. **Node.js Process**: If `/opt/zoth-hud/main.js` exists and `node` is in `PATH`, it starts `node /opt/zoth-hud/main.js "$@"`.
3. **Fallback Interactive Shell**: If neither runner is found, it reports whether `/opt/zoth-desktop-pet` is present on disk and drops the user into an interactive `bash` session.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-pet-hud|zoth-pet-hud]]