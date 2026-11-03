---
title: "zoth-web3"
tags: [os, cli]
aliases: ["zoth-web3"]
---

# zoth-web3

`file`: Bourne-Again shell script.

`zoth-web3` is the launcher script for the ZothOS Web3 & Solana Core Studio, located at `/usr/local/bin/zoth-web3`.

### Launch Behavior

- **Electron GUI Application**: If `$DISPLAY` is set and `electron` is present on the system:
  - Launches `/opt/zoth-web3-app` if `/opt/zoth-web3-app/main.js` exists.
  - Alternatively targets `${ZOTHOS_SRC}/config/includes.chroot/opt/zoth-web3-app` when running from a development checkout.
  - Passes flags `--no-sandbox --disable-dev-shm-usage --disable-gpu-sandbox`.
- **Terminal Fallback**: If graphical Electron prerequisites are unavailable, it launches `konsole` titled `"Web3 Sovereign Engineering"` executing:
  ```bash
  zoth-tool-nexus --domain 7
  ```

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-tool-nexus|zoth-tool-nexus]]