---
title: "zoth-music"
tags: [os, cli]
aliases: ["zoth-music"]
---

# zoth-music

`file`: Bourne-Again shell script.

`zoth-music` is a convenience wrapper and alias for the Zoth Soundtrack Engine (`zoth-soundtrack`).

## Behavior

The script executes the underlying audio engine binary, forwarding all arguments:

```bash
exec zoth-soundtrack "$@"
```

Through `zoth-soundtrack`, it invokes the Zoth Hermetic Audio Studio Electron player (`/opt/zoth-music-app`) when a graphical environment is detected, or falls back to headless audio playback.

## File Locations

- **Alias Script**: `/usr/local/bin/zoth-music`
- **Engine Binary**: `/usr/local/bin/zoth-soundtrack`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-soundtrack|zoth-soundtrack]]