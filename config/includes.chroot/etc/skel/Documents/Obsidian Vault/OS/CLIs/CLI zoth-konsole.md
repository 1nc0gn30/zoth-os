---
title: "zoth-konsole"
tags: [os, cli]
aliases: ["zoth-konsole"]
---

# zoth-konsole

`file`: Bourne-Again shell script.

`zoth-konsole` is the standard terminal launcher for ZothOS. It executes commands in KDE Konsole without `--hold` or `--noclose`, ensuring terminal windows cleanly close when processes terminate or receive `Ctrl+C`.

## Usage & Options

```bash
zoth-konsole [--title NAME] [--pause] [--shell] [--] command [args...]
```

- **`--title NAME`** / **`-t`**: Sets the Konsole tab title and window header (`--qwindowtitle`).
- **`--pause`**: Waits for user input (`Enter` or `Ctrl+C`) after command completion, displaying the exit code before closing. Ideal for one-shot status and diagnostic runs.
- **`--shell`**: Spawns an interactive bash shell after the command completes, closing only when the shell session exits.
- **`--`**: Delimiter to separate launcher options from the target command and its arguments.

## Implementation Details

- **Path**: `/usr/local/bin/zoth-konsole`
- **Session Wrapper**: Wraps commands via `/usr/local/bin/zoth-term-session`
- **Runtime**: `/usr/bin/env bash` (`set -euo pipefail`)

## See also

[[Zoth OS]] · [[MOC CLIs]]