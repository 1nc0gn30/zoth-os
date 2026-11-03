---
title: "zoth-neuro-memory"
tags: [os, cli]
aliases: ["zoth-neuro-memory"]
---

# zoth-neuro-memory

Chroot entry is a symlink → `neuro-memory`.

`zoth-neuro-memory` is a launcher script for the Neuro-Memory daemon and biological memory substrate CLI in ZothOS. Located at `/usr/local/bin/zoth-neuro-memory`.

## Purpose & Execution Logic
The script acts as a runtime wrapper resolving to the local repository directory:
`/home/zoth/NullAITech/neuro-memory-daemon`

When invoked, it resolves its execution target through fallback order:
1. **Python Module**: If `/home/zoth/NullAITech/neuro-memory-daemon/src/neuro_memory_daemon` exists, it prepends the `src` directory to `PYTHONPATH` and invokes:
   ```bash
   python3 -m neuro_memory_daemon.cli "$@"
   ```
2. **Node/JS Binary**: Otherwise, if `/home/zoth/NullAITech/neuro-memory-daemon/bin/neuro-memory.js` exists and is executable, it dispatches directly:
   ```bash
   exec "$PRIMARY_BIN" "$@"
   ```
3. **Error Handling**: If neither runtime target is found, it reports an error to `stderr` and exits with status code `1`.

All command-line arguments are passed directly to the underlying daemon CLI.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-neuro-memory|zoth-neuro-memory]]