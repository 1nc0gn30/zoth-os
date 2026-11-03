---
title: "zoth-os"
tags: [os, cli]
aliases: ["zoth-os"]
---

# zoth-os

`file`: Bourne-Again shell script.

`zoth-os` is the launcher script for the Zoth OS desktop environment, running either as a native Electron shell or falling back to a Python HTTP backend. Located at `/usr/local/bin/zoth-os`.

## Location Discovery
The script locates the Zoth OS application root (`ROOT`) by checking for `serve.py` in three candidate paths:
1. `/opt/zoth-os`
2. Relative directory `"$HERE/../../../opt/zoth-os"`
3. `"${ZOTHOS_SRC:-}/config/includes.chroot/opt/zoth-os"`

If none contains `serve.py`, it exits with status `1`.

## Execution Mechanics
- **Library Path**: Sets `LD_LIBRARY_PATH` to include `/opt/electron`.
- **Electron Detection**: Searches for an executable `electron` binary in `/usr/local/bin/electron`, `/opt/electron/electron`, `/tmp/electron/electron`, or via `PATH`.
- **Graphical Launch**: If an Electron binary is present and an active display exists (`DISPLAY` or `WAYLAND_DISPLAY`), it executes:
  ```bash
  exec "$ELECTRON_BIN" --no-sandbox --disable-dev-shm-usage --disable-gpu-sandbox --disable-gpu "$ROOT" "$@"
  ```
- **Headless / Fallback Launch**: If no display or Electron binary is available, it falls back directly to the Python server:
  ```bash
  exec python3 "$ROOT/serve.py" "$@"
  ```

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio zoth-os|Zoth OS v3.2]] · [[Route zothos|/zothos]] · [[Route zoth-os|/zoth-os]] · [[Desktop zoth-os|zoth-os]]