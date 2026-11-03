---
title: "zoth-docs"
tags: [os, cli]
aliases: ["zoth-docs"]
---

# zoth-docs

`file`: Bourne-Again shell script.

`zoth-docs` is the ZOTHOS Sovereign Documentation Codex Runner, providing instant access to the offline HTML documentation manual located at `/opt/zoth-docs`.

### Viewer Selection & Fallback Hierarchy
The script detects available graphical applications and launches `/opt/zoth-docs` through the most suitable local viewer:
1. **Electron Application**: If Electron is installed (`/usr/local/bin/electron`, `/opt/electron/electron`, or `$PATH`), runs the codex with `--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu-sandbox`, and `--ozone-platform-hint=auto`.
2. **Google Chrome App Mode**: If Electron is missing, falls back to `google-chrome --no-sandbox --app="file:///opt/zoth-docs/index.html"`.
3. **Firefox**: If Chrome is absent, opens `file:///opt/zoth-docs/index.html` in Firefox.
4. **Desktop Default Handler**: If neither browser is explicitly detected, delegates to `xdg-open`.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-docs|zoth-docs]]