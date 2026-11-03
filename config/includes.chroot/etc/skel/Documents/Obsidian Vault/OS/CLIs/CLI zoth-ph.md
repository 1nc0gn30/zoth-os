---
title: "zoth-ph"
tags: [os, cli]
aliases: ["zoth-ph"]
---

# zoth-ph

`file`: Bourne-Again shell script.

`zoth-ph` is a wrapper script for the ZothOS Product Hunt connector, designed to inspect product listings and diff them against websites or GitHub without automated posting. Located at `/usr/local/bin/zoth-ph`.

## Operational Principle
The script's header comment defines its operational constraint:
> *"Read listing, diff website/GitHub. Never auto-post."*

## Repository & Execution Dispatch
The wrapper resolves against the `producthunt-connector` repository:
- Repository path: defaults to `~/NullAITech/producthunt-connector` (overridable via the `ZOTH_PH_REPO` environment variable).

It dispatches execution via the following fallback order:
1. **Direct Binary**: If `/bin/zoth-ph` within the repository exists and is executable, it executes:
   ```bash
   exec "$BIN" "$@"
   ```
2. **Python Module**: If the `src/producthunt_connector` package directory exists, it sets `PYTHONPATH` to include the `src/` directory and executes:
   ```bash
   exec python3 -m producthunt_connector.cli "$@"
   ```
3. **Error Reporting**: If neither the binary nor the Python package is found, it prints an error to `stderr` and exits with status `1`.

## See also

[[Zoth OS]] · [[MOC CLIs]]