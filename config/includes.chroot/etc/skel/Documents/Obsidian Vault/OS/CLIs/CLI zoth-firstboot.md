---
title: "zoth-firstboot"
tags: [os, cli]
aliases: ["zoth-firstboot"]
---

# zoth-firstboot

`file`: Bourne-Again shell script.

`zoth-firstboot` is a post-installation provisioning script located at `/usr/local/bin/zoth-firstboot`.

### Lifecycle & Guard

The script checks for the flag file `~/.config/zothos/firstboot.done`. If the flag exists, it exits immediately with code 0 to prevent redundant executions. Execution details are logged to `/var/log/zoth-nexus-firstboot.log`.

### Initialization Workflow

1. **Initial Notification**: Sends a desktop alert via `notify-send` announcing the active Zoth Tool Nexus and Arsenal.
2. **Background Setup Subshell**:
   - Sets user ownership on `/opt/zothos-ai-env` and sets permissions on `/tmp` (1777).
   - Creates convenience symlinks for CLI utilities (`batcat` → `/usr/local/bin/bat`, `fdfind` → `/usr/local/bin/fd`).
   - Ensures execution bits on all `/usr/local/bin/zoth*` scripts.
   - Exposes non-python environment binaries from `/opt/zothos-ai-env/bin/` into `/usr/local/bin/`.
   - Starts Ollama via `systemctl enable --now ollama` (or background `ollama serve` fallback).
   - Initializes IPFS repository (`ipfs init`) for user `zoth` if `ipfs` is present and `~/.ipfs` is uninitialized.
   - Refreshes dynamic linker bindings (`ldconfig`) and desktop database caches (`update-desktop-database`).
   - Runs `zoth-pkg verify`.
   - Creates the completion flag `~/.config/zothos/firstboot.done` and sends a final completion notification.

## See also

[[Zoth OS]] · [[MOC CLIs]]