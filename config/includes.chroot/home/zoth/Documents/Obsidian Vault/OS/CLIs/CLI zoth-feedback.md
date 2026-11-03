---
title: "zoth-feedback"
tags: [os, cli]
aliases: ["zoth-feedback"]
---

# zoth-feedback

`file`: Bourne-Again shell script.

`zoth-feedback` is an anonymous sovereign feedback launcher script located at `/usr/local/bin/zoth-feedback`.

### Launch Hierarchy

The script runs the feedback application situated at `/opt/zoth-feedback` through available graphical runtimes in prioritized sequence:

1. **System Electron**: Executes `electron --no-sandbox --disable-dev-shm-usage --disable-gpu-sandbox /opt/zoth-feedback "$@"`.
2. **Local Electron**: Falls back to `/usr/local/bin/electron` with the same sandbox-disabling parameters.
3. **Google Chrome App Mode**: Launches `google-chrome --no-sandbox --app="file:///opt/zoth-feedback/index.html" "$@"`.
4. **Firefox Browser**: Launches `firefox "file:///opt/zoth-feedback/index.html" "$@"`.
5. **System Default**: Falls back to `xdg-open "file:///opt/zoth-feedback/index.html"` if no browser or Electron binaries are available.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-feedback|zoth-feedback]]