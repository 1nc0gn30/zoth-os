---
title: "zoth-quicklock"
tags: [os, cli]
aliases: ["zoth-quicklock"]
---

# zoth-quicklock

`file`: Bourne-Again shell script.

`zoth-quicklock` is a panic screen-lock and display-freeze utility located at `/usr/local/bin/zoth-quicklock`.

### Operational Behavior

The script acts as a fast toggle mechanism to enforce an immediate secure screen posture:

1. **State Tracking**: Uses a transient state file at `/tmp/.zoth-quicklock-active`.
2. **Engaging the Lock**:
   - Creates `/tmp/.zoth-quicklock-active`.
   - In graphical X11 sessions where `xset` is available, it immediately blanks the display using DPMS (`xset dpms force blank`).
   - Remains active, holding execution until the user presses Enter in the invoking terminal or removes the lock file manually.
3. **Releasing the Lock**:
   - If executed while `/tmp/.zoth-quicklock-active` is already present, it deletes the file and exits cleanly (`exit 0`), unlocking the system.
   - Alternatively, typing `zoth-quicklock --unlock` or manually removing the lockfile releases the state.

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-quicklock`
- **Interpreter**: `/usr/bin/env bash`
- **Lock File**: `/tmp/.zoth-quicklock-active`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-quicklock|zoth-quicklock]]