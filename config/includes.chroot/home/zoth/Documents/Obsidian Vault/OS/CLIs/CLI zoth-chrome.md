---
title: "zoth-chrome"
tags: [os, cli]
aliases: ["zoth-chrome"]
---

# zoth-chrome

`file`: Bourne-Again shell script.

`zoth-chrome` is the resilient enterprise web engine launcher located at `/usr/local/bin/zoth-chrome`.

It provides a hardened, VM-aware wrapper around Chromium- and Chrome-based browsers, applying stability flags and automatic fallbacks to ensure reliable browser rendering in virtualized or sandbox-restricted environments.

### Core Architecture & Flags

- **Standard Runtime Flags**:
  - `--no-sandbox` and `--test-type`: Prevents namespace sandbox panics in virtualized containers or live boot environments.
  - `--disable-dev-shm-usage`: Avoids shared memory crashes on systems with small `/dev/shm` partitions.
  - `--password-store=basic`: Prevents keyring prompts on headless or automated sessions.
  - `--no-first-run` and `--no-default-browser-check`: Suppresses first-run wizard prompts.
- **Graphics & VM Compatibility**:
  - Sources `/usr/lib/zothos/gfx-compat.sh` when present, invoking `zoth_chromium_gfx_flags()` to enforce software rendering workarounds when running in VMs lacking hardware GPU acceleration.
- **Browser Discovery & Fallbacks**:
  - Searches in order for Google Chrome (`/usr/bin/google-chrome-stable`, `/usr/bin/google-chrome`, `/opt/google/chrome/*`) and Chromium (`/usr/bin/chromium`, `/usr/bin/chromium-browser`), using `readlink -f` to prevent recursive execution loops.
  - If no Chromium-based binary is found, falls back to `firefox` or `firefox-esr`.
  - Dispatches a critical desktop notification via `notify-send` if no supported browser is available.

## See also

[[Zoth OS]] · [[MOC CLIs]]