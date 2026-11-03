---
title: "zoth-electron-install"
tags: [os, cli]
aliases: ["zoth-electron-install"]
---

# zoth-electron-install

`file`: Bourne-Again shell script.

`zoth-electron-install` is an administration script located at `/usr/local/bin/zoth-electron-install` used to install or refresh the shared Electron runtime in `/opt/electron`.

### Purpose & Architecture

The shared runtime in `/opt/electron` powers system desktop applications including Zoth Arsenal Provisioner, Hermetic Audio Studio, Desktop Pet, and Maya via `/usr/local/bin/electron`.

### Operations Performed

1. **Privilege check**: Re-executes with `sudo` if not run as root.
2. **Architecture detection**: Maps `aarch64` and `arm64` to `arm64`, defaulting to `x64`.
3. **Dependency checks**: Installs `unzip`, `curl`, and `ca-certificates` via `apt-get` if missing.
4. **Download & verification**:
   - Downloads `electron-v${VERSION}-linux-${ARCH}.zip` and `SHASUMS256.txt` from GitHub releases.
   - Version defaults to `$ZOTHOS_ELECTRON_VERSION` or `44.4.5`, or can be passed as argument 1.
   - Verifies the archive SHA256 checksum before unpacking.
5. **Installation**:
   - Extracts into `/opt/electron.new` in a temporary directory.
   - Sets root ownership and marks `/opt/electron/chrome-sandbox` with setuid permissions (`chmod 4755`).
   - Atomically replaces `/opt/electron` and invokes `ldconfig`.

### Usage

```bash
sudo zoth-electron-install [version]
```

## See also

[[Zoth OS]] · [[MOC CLIs]]