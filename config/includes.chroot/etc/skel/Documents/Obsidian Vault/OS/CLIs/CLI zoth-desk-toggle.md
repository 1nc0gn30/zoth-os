---
title: "zoth-desk-toggle"
tags: [os, cli]
aliases: ["zoth-desk-toggle"]
---

# zoth-desk-toggle

`file`: Bourne-Again shell script.

`zoth-desk-toggle` is a lightweight bash utility bound to the desktop keyboard shortcut `<Super>d` to quickly show or hide the Zoth OS desk interface.

### Operation & Behavior
- **Service Verification**: Checks if the local desk web server is responding at `http://127.0.0.1:8770/`.
- **Background Autostart**: If the server is offline, it spawns `zoth-os --no-open >/tmp/zoth-os.log 2>&1 &` and polls the endpoint every 250ms (up to 12 attempts / 3 seconds) until responsive.
- **Window Toggle**:
  - If a window titled `Zoth OS` is already open, it closes or hides it using `wmctrl -c 'Zoth OS'`.
  - If the window is not currently open, it launches a new browser window pointing to `http://127.0.0.1:8770/` using `firefox-esr` (or `firefox` as fallback).

## See also

[[Zoth OS]] · [[MOC CLIs]]