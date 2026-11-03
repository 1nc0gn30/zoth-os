---
title: "zoth-tools-installer"
tags: [os, cli]
aliases: ["zoth-tools-installer"]
---

# zoth-tools-installer

`file`: Bourne-Again shell script.

`zoth-tools-installer` launches the Zoth Arsenal Provisioner graphical installer or falls back to headless batch package installation.

## What it does

The script manages package bundle installation (covering Kali, Parrot, Dev, AI, and Web3 suites) across GUI and headless environments:

- **Headless mode:** If no active graphical display (`$DISPLAY` or `$WAYLAND_DISPLAY`) is detected, it redirects to the CLI provisioner:
  ```bash
  exec /usr/local/bin/zoth-tool-nexus --install-all
  ```
- **Graphical Electron mode:** When a display is detected, it validates that `/opt/zoth-nexus-app` and `/usr/local/bin/electron` exist, then launches the application into its curated bundle view:
  ```bash
  exec /usr/local/bin/electron /opt/zoth-nexus-app --bundle "$@"
  ```
- **Error handling:** If the app bundle or Electron runtime is missing, it emits a critical desktop notification (`notify-send -u critical`) and exits with status 1.

## Paths and runtimes

- **App bundle:** `/opt/zoth-nexus-app`
- **Runtime:** `/usr/local/bin/electron`
- **Headless fallback:** `/usr/local/bin/zoth-tool-nexus`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-tools-installer|zoth-tools-installer]]