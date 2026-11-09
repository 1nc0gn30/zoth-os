---
title: "zoth-lock"
tags: [os, cli]
aliases: ["zoth-lock"]
---

# zoth-lock

`file`: Python script.

`zoth-lock` is a walk-away screen lock overlay for ZothOS. It protects the desktop with a dedicated password while allowing background tasks, AI agents, and development servers to keep running uninterrupted.

## Key Behavior & Security

- **Process Continuity**: Inhibits system sleep, idle suspend, and lid-close triggers (`sleep:idle:handle-lid-switch`) via systemd during the lock session.
- **Dedicated Passphrase**: Stores an scrypt-hashed secret in `~/.config/zothos/session-lock.hash` (permissions `0600`). Passwords are never accepted via command-line arguments.
- **KDE Coexistence**: Standard Super+L remains bound to the system KDE session locker; `zoth-lock` serves as a walk-away shield for ongoing background operations.

## Command-Line Options

```bash
zoth-lock [OPTIONS]
```

- `--lock`: Activates the screen lock (default when invoked without flags).
- `--unlock`: Unlocks an active `zoth-lock` instance.
- `--set-password`: Prompts in a local window to define or update the lock password.
- `--status`: Displays current lock status and configuration state.
- `--reset`: Clears the stored password hash (available only when unlocked).
- `--preview`: Displays a closeable preview of the lock screen without locking the session.
- `--render-preview PNG`: Renders a still snapshot of the lock UI to an image file.
- `--selftest`: Runs cryptographic hashing and UI smoke checks without engaging the lock.
- `--room-sentry`: Launches OpenCV motion sentry and Tailscale live view (:8499).
- `--lock-gated`: Strictly gates motion detection and camera capture to active lock sessions (releases `/dev/video0` and idles at 0% CPU when unlocked).
- `--standalone`: Allows motion detection without locking the session (manual room watch).
- `--audit-log`: Displays recent lock sessions and intruder sentry events.

## Implementation Details

- **Path**: `/usr/local/bin/zoth-lock`
- **Runtime**: `/usr/bin/env python3`
- **Lock Tracking**: Uses `$XDG_RUNTIME_DIR/zoth-lock.pid` for session management

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-lock|zoth-lock]]