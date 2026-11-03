---
title: "zoth-term-session"
tags: [os, cli]
aliases: ["zoth-term-session"]
---

# zoth-term-session

`file`: Bourne-Again shell script.

`zoth-term-session` is a terminal execution harness used to run commands inside terminal emulators (such as Konsole) with clean lifecycle and signal handling.

## What it does

The script executes a command in the foreground and manages its exit behavior so terminal windows close properly:

- **Signal handling:** Traps `SIGINT` (Ctrl+C) to print an interruption notice and exit with status 130, and traps `SIGTERM` to exit with status 143. If a child process is interrupted by SIGINT, the exit code is propagated immediately.
- **Process lifecycle:** Executes the provided arguments in the foreground process group.
- **Post-execution modes:**
  - `--pause`: Keeps the window open after the command finishes, prints whether the command succeeded or failed with its exit status, and waits for the user to press Enter or Ctrl+C before closing.
  - `--shell`: Drops to an interactive shell (`exec bash --login || exec bash`) after the command completes, allowing further manual terminal work.
  - Default: Immediately exits with the command's return code, allowing the terminal window to close automatically.

## Syntax

```bash
zoth-term-session [--pause] [--shell] [--] <command> [args...]
```

## See also

[[Zoth OS]] · [[MOC CLIs]]